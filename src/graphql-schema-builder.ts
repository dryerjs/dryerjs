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
import { ModelDefinition } from './type';
import { MetaKey, TraversedProperty, inspect } from './metadata';

const enumTypeCached = {};

export abstract class BaseTypeBuilder {
    constructor(protected modelDefinition: ModelDefinition) {}

    protected abstract getName(): string;
    protected abstract isExcluded(property: TraversedProperty): boolean;
    protected abstract isNullable(property: TraversedProperty): boolean;
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

    private getPropertyType(property: TraversedProperty, nullable: boolean) {
        const baseType = this.getPropertyBaseType(property);
        return nullable ? baseType : new GraphQLNonNull(baseType);
    }

    private getPropertyBaseType(property: TraversedProperty) {
        const overrideType = property.getMetaValue(MetaKey.GraphQLType);
        if (util.isObject(overrideType)) return overrideType;

        const enumInObject = property.getMetaValue(MetaKey.Enum);
        if (util.isObject(enumInObject)) {
            const enumName = Object.keys(enumInObject)[0];
            const enumValues = enumInObject[enumName];

            enumTypeCached[enumName] =
                enumTypeCached[enumName] ??
                new GraphQLEnumType({
                    name: enumName,
                    values: Object.keys(enumValues).reduce((values, key) => {
                        values[key] = { value: enumValues[key] };
                        return values;
                    }, {}),
                });

            return enumTypeCached[enumName];
        }
        const typeConfig = {
            String: GraphQLString,
            Date: GraphQLString,
            Number: GraphQLFloat,
            Boolean: GraphQLBoolean,
        };

        const scalarBaseType = typeConfig[property.typeInClass.name];
        if (util.isNotNullObject(scalarBaseType)) return scalarBaseType;

        const isEmbedded = util.isFunction(property.getMetaValue(MetaKey.Embedded));
        if (isEmbedded) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const subType = new this.constructor(property.getMetaValue(MetaKey.Embedded)).getType();
            const isEmbeddedArray = property.typeInClass.name === 'Array';
            return isEmbeddedArray ? new GraphQLList(subType) : subType;
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

    protected isExcluded(property: TraversedProperty) {
        return property.getMetaValue(MetaKey.ExcludeOnOutput);
    }

    protected isNullable(property: TraversedProperty) {
        return property.getMetaValue(MetaKey.NullableOnOutput);
    }

    protected useAs: 'input' | 'output' = 'output';
}

class CreateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Create${this.modelDefinition.name}Input`;
    }

    protected isExcluded(property: TraversedProperty) {
        return property.getMetaValue(MetaKey.ExcludeOnCreate);
    }

    protected isNullable(property: TraversedProperty) {
        return !property.getMetaValue(MetaKey.RequiredOnCreate);
    }

    protected useAs: 'input' | 'output' = 'input';
}

class UpdateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Update${this.modelDefinition.name}Input`;
    }

    protected isExcluded(property: TraversedProperty) {
        return property.getMetaValue(MetaKey.ExcludeOnUpdate);
    }

    protected isNullable(property: TraversedProperty) {
        return !property.getMetaValue(MetaKey.RequiredOnUpdate);
    }

    protected useAs: 'input' | 'output' = 'input';
}

export class GraphqlTypeBuilder {
    static build(modelDefinition: ModelDefinition) {
        const output = new OutputTypeBuilder(modelDefinition).getType() as GraphQLObjectType;
        const create = new CreateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        const update = new UpdateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        const nonNullOutput = new GraphQLNonNull(output);
        return {
            output,
            nonNullOutput,
            create,
            update,
            paginatedOutput: this.getPaginatedOutputType(modelDefinition, nonNullOutput),
        };
    }

    private static getPaginatedOutputType(
        modelDefinition: ModelDefinition,
        nonNullOutput: GraphQLNonNull<GraphQLObjectType<ModelDefinition, any>>,
    ) {
        const result = {
            name: `Paginated${modelDefinition.name}s`,
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
