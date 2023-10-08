import {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLInt,
    GraphQLList,
} from 'graphql';
import * as util from './util';
import { ModelDefinition, RelationKind } from './shared';
import { MetaKey } from './metadata';
import { Property } from './property';
import { inspect } from './inspect';
import { ModelGetter } from './model';

export abstract class BaseTypeBuilder {
    constructor(
        protected modelDefinition: ModelDefinition,
        protected dryer: ModelGetter,
    ) {}

    protected abstract getName(): string;
    protected abstract isExcluded(property: Property): boolean;
    protected abstract isNullable(property: Property): boolean;
    protected abstract useAs: 'input' | 'output';

    public getType() {
        const result = {
            name: this.getName(),
            fields: {},
        };

        inspect(this.modelDefinition)
            .getProperties()
            .forEach(property => {
                if (this.isExcluded(property)) return;
                const isNullable = this.isNullable(property);
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const that = this;
                const propertyType = this.getPropertyType(property, isNullable);
                result.fields[property.name] = propertyType?.resolve
                    ? propertyType
                    : {
                          get type() {
                              return that.getPropertyType(property, isNullable);
                          },
                      };
            });

        if (this.useAs === 'input') return new GraphQLInputObjectType(result);
        if (this.useAs === 'output') return new GraphQLObjectType(result);
        /* istanbul ignore next */
        throw new Error('Invalid useAs');
    }

    private getPropertyType(property: Property, nullable: boolean) {
        const baseType = this.getPropertyBaseType(property);
        return nullable ? baseType : new GraphQLNonNull(baseType);
    }

    protected getPropertyBaseType(property: Property) {
        const overrideType = property.getMetaValue(MetaKey.GraphQLType);
        if (util.isObject(overrideType)) return overrideType;

        const typeConfig = {
            String: GraphQLString,
            Date: GraphQLString,
            Number: GraphQLFloat,
            Boolean: GraphQLBoolean,
        };

        const isScalarArrayType =
            property.isArray() && util.isFunction(property.getMetaValue(MetaKey.ScalarArrayType));
        if (isScalarArrayType) {
            return new GraphQLList(typeConfig[property.getMetaValue(MetaKey.ScalarArrayType).name]);
        }

        const enumInObject = property.getMetaValue(MetaKey.Enum);
        if (util.isObject(enumInObject)) {
            const cacheKey = '__graphql_enum_type__';
            const enumName = Object.keys(enumInObject)[0];
            const enumValues = enumInObject[enumName];

            enumInObject[cacheKey] =
                enumInObject[cacheKey] ??
                new GraphQLEnumType({
                    name: enumName,
                    values: Object.keys(enumValues)
                        .filter(key => !'0123456789'.includes(key)) // support enum for numbers
                        .reduce((values, key) => {
                            values[key] = { value: enumValues[key] };
                            return values;
                        }, {}),
                });

            return property.isArray() ? new GraphQLList(enumInObject[cacheKey]) : enumInObject[cacheKey];
        }

        if (property.isScalar()) return typeConfig[property.typeInClass.name];

        if (property.isEmbedded()) {
            const { create, update, output } = Typer.get(property.getEmbeddedModelDefinition());
            const subType = (() => {
                if (this.useAs === 'output') return output;
                if (this.useAs === 'input' && this.getName().startsWith('Create')) return create;
                return update;
            })();
            return property.isArray() ? new GraphQLList(subType) : subType;
        }

        throw new Error(
            `Invalid type for property ${property.name} for ${this.modelDefinition.name}. You can override it with @GraphQLType(/* type */)`,
        );
    }
}

class OutputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return this.modelDefinition.name;
    }

    protected isExcluded(property: Property) {
        return property.getMetaValue(MetaKey.ExcludeOnOutput);
    }

    protected isNullable(property: Property) {
        return property.getMetaValue(MetaKey.NullableOnOutput);
    }

    protected getPropertyBaseType(property: Property) {
        if (!property.isRelation()) return super.getPropertyBaseType(property);
        if (property.getRelation().kind === RelationKind.BelongsTo) {
            const resolve = (parent: any, _args: any, context: any) => {
                const filter = { [property.getRelation().to]: parent[property.getRelation().from] };
                return this.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getOne(filter);
            };

            return {
                get type() {
                    return Typer.get(property.getRelationModelDefinition()).output;
                },
                resolve,
            };
        }

        if (property.getRelation().kind === RelationKind.HasMany) {
            const resolve = async (parent: any, _args: any, context: any) => {
                const filter = { [property.getRelation().to]: parent[property.getRelation().from] };
                return await this.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getAll(filter);
            };
            return {
                get type() {
                    return new GraphQLList(Typer.get(property.getRelationModelDefinition()).output);
                },
                resolve,
            };
        }

        if (property.getRelation().kind === RelationKind.HasOne) {
            const resolve = async (_parent: any, _args: any, context: any) => {
                const filter = { [property.getRelation().to]: _parent[property.getRelation().from] };
                const [result] = await this.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getAll(filter);

                return result;
            };
            return {
                get type() {
                    return Typer.get(property.getRelationModelDefinition()).output;
                },
                resolve,
            };
        }
        if (property.getRelation().kind === RelationKind.ReferencesMany) {
            const resolve = async (parent: any, _args: any, context: any) => {
                const filter = { [property.getRelation().to]: { $in: parent[property.getRelation().from] } };
                return await this.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getAll(filter);
            };
            return {
                get type() {
                    return new GraphQLList(Typer.get(property.getRelationModelDefinition()).output);
                },
                resolve,
            };
        }
        /* istanbul ignore next */
        throw new Error(`Invalid relation kind ${property.getRelation().kind}`);
    }

    protected useAs: 'input' | 'output' = 'output';
}

class CreateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Create${this.modelDefinition.name}Input`;
    }

    protected isExcluded(property: Property) {
        return property.getMetaValue(MetaKey.ExcludeOnCreate);
    }

    protected isNullable(property: Property) {
        return !property.getMetaValue(MetaKey.RequiredOnCreate);
    }

    protected getPropertyBaseType(property: Property) {
        if (!property.isRelation()) return super.getPropertyBaseType(property);
        if (property.getRelation().kind === RelationKind.ReferencesMany) {
            return new GraphQLList(Typer.get(property.getRelationModelDefinition()).create);
        }
        if (
            property.getRelation().kind === RelationKind.HasMany ||
            property.getRelation().kind === RelationKind.HasOne
        ) {
            const subType = Typer.getCreateInputForBelongingModel(
                property.getRelationModelDefinition(),
                property,
            );
            return property.isArray() ? new GraphQLList(subType) : subType;
        }
        /* istanbul ignore next */
        throw new Error(`Invalid relation kind ${property.getRelation().kind}`);
    }
    protected useAs: 'input' | 'output' = 'input';
}

class UpdateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Update${this.modelDefinition.name}Input`;
    }

    protected isExcluded(property: Property) {
        return property.getMetaValue(MetaKey.ExcludeOnUpdate);
    }

    protected isNullable(property: Property) {
        return !property.getMetaValue(MetaKey.RequiredOnUpdate);
    }

    protected useAs: 'input' | 'output' = 'input';
}

export class Typer {
    private static dryer: ModelGetter;

    public static init(dryer: ModelGetter) {
        this.dryer = dryer;
    }

    public static get(modelDefinition: ModelDefinition) {
        /* istanbul ignore if */
        if (util.isNil(this.dryer)) {
            throw new Error('Typer is not initialized');
        }
        const cacheKey = '__typer__';
        if (modelDefinition[cacheKey]) return modelDefinition[cacheKey] as ReturnType<typeof Typer.build>;
        const result = this.build(modelDefinition);
        modelDefinition[cacheKey] = result;
        return result;
    }

    public static getCreateInputForBelongingModel(modelDefinition: ModelDefinition, property: Property) {
        const { create } = this.get(modelDefinition);
        const result = {
            name: `Create${modelDefinition.name}InputInside${property.modelDefinition.name}`,
            fields: {},
        };

        const originalFields = Object.keys(create['_fields']());
        const toField = property.getRelation().to;

        for (const originalField of originalFields) {
            if (originalField === toField) continue;
            result.fields[originalField] = create['_fields']()[originalField];
        }

        return new GraphQLInputObjectType(result);
    }

    private static build(modelDefinition: ModelDefinition) {
        const output = new OutputTypeBuilder(modelDefinition, this.dryer).getType() as GraphQLObjectType;
        const create = new CreateInputTypeBuilder(
            modelDefinition,
            this.dryer,
        ).getType() as GraphQLInputObjectType;

        const update = new UpdateInputTypeBuilder(
            modelDefinition,
            this.dryer,
        ).getType() as GraphQLInputObjectType;

        const nonNullOutput = new GraphQLNonNull(output);
        const result = {
            output,
            nonNullOutput,
            create,
            update,
            paginatedOutput: this.getPaginatedOutputType(modelDefinition, nonNullOutput),
        };
        return result;
    }

    private static getPaginatedOutputType(
        modelDefinition: ModelDefinition,
        nonNullOutput: GraphQLNonNull<GraphQLObjectType<ModelDefinition, any>>,
    ) {
        const result = {
            name: `Paginated${util.plural(modelDefinition.name)}`,
            fields: {
                docs: { type: new GraphQLList(nonNullOutput) },
                totalDocs: { type: GraphQLInt },
                page: { type: GraphQLInt },
                limit: { type: GraphQLInt },
                hasPrevPage: { type: GraphQLBoolean },
                hasNextPage: { type: GraphQLBoolean },
                totalPages: { type: GraphQLInt },
            },
        };
        return new GraphQLObjectType(result);
    }
}
