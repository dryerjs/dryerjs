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
import { ModelDefinition } from './shared';
import { MetaKey } from './metadata';
import { Property } from './property';
import { inspect } from './inspect';

export abstract class BaseTypeBuilder {
    constructor(protected modelDefinition: ModelDefinition) {}

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
                const type = this.getPropertyType(property, isNullable);
                result.fields[property.name] = { type };
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

    private getPropertyBaseType(property: Property) {
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

        const scalarBaseType = typeConfig[property.typeInClass.name];
        if (util.isNotNullObject(scalarBaseType)) return scalarBaseType;

        const isEmbedded = util.isFunction(property.getMetaValue(MetaKey.Embedded));
        if (isEmbedded) {
            const { create, update, output } = Typer.get(property.getMetaValue(MetaKey.Embedded));
            const subType = (() => {
                if (this.useAs === 'output') return output;
                if (this.useAs === 'input' && this.getName().startsWith('Create')) return create;
                return update;
            })();
            return property.isArray() ? new GraphQLList(subType) : subType;
        }

        throw new Error(
            `Invalid type for property ${property.name}. You can override it with @GraphQLType(/* type */)`,
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
    static get(modelDefinition: ModelDefinition) {
        const cacheKey = '__graphql_type_builder__';
        if (modelDefinition[cacheKey]) return modelDefinition[cacheKey];
        const output = new OutputTypeBuilder(modelDefinition).getType() as GraphQLObjectType;
        const create = new CreateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        const update = new UpdateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        const nonNullOutput = new GraphQLNonNull(output);
        const result = {
            output,
            nonNullOutput,
            create,
            update,
            paginatedOutput: this.getPaginatedOutputType(modelDefinition, nonNullOutput),
        };
        modelDefinition[cacheKey] = result;
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
