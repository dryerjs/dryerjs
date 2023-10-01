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
    protected abstract isExcluded(traversedProperty: TraversedProperty): boolean;
    protected abstract isNullable(traversedProperty: TraversedProperty): boolean;
    protected abstract useAs: 'input' | 'output';

    public getType() {
        const result = {
            name: this.getName(),
            fields: {},
        };

        inspect(this.modelDefinition)
            .getProperties()
            .forEach(traversedProperty => {
                if (this.isExcluded(traversedProperty)) return;
                const isNullable = this.isNullable(traversedProperty);
                const type = this.getTypeForOneProperty(traversedProperty, isNullable);
                result.fields[traversedProperty.name] = { type };
            });

        if (this.useAs === 'input') return new GraphQLInputObjectType(result);
        if (this.useAs === 'output') return new GraphQLObjectType(result);
        /* istanbul ignore next */
        throw new Error('Invalid useAs');
    }

    private getTypeForOneProperty(traversedProperty: TraversedProperty, nullable: boolean) {
        const baseType = this.getBaseTypeForProperty(traversedProperty);
        return nullable ? baseType : new GraphQLNonNull(baseType);
    }

    private getBaseTypeForProperty(traversedProperty: TraversedProperty) {
        const overrideType = traversedProperty.getMetaValue(MetaKey.GraphQLType);
        if (util.isObject(overrideType)) return overrideType;

        const enumInObject = traversedProperty.getMetaValue(MetaKey.Enum);
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

        const scalarBaseType = typeConfig[traversedProperty.typeInClass.name];
        if (util.isNotNullObject(scalarBaseType)) return scalarBaseType;

        const isEmbedded = traversedProperty.getMetaValue(MetaKey.Embedded);
        if (isEmbedded) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new this.constructor(traversedProperty.typeInClass).getType();
        }

        throw new Error(
            `Invalid type for property ${traversedProperty.name}. You can override it with @GraphQLType(/* type */)`,
        );
    }
}

class OutputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return this.modelDefinition.name;
    }

    protected isExcluded(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetaValue(MetaKey.ExcludeOnOutput);
    }

    protected isNullable(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetaValue(MetaKey.NullableOnOutput);
    }

    protected useAs: 'input' | 'output' = 'output';
}

class CreateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Create${this.modelDefinition.name}Input`;
    }

    protected isExcluded(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetaValue(MetaKey.ExcludeOnCreate);
    }

    protected isNullable(traversedProperty: TraversedProperty) {
        return !traversedProperty.getMetaValue(MetaKey.RequiredOnCreate);
    }

    protected useAs: 'input' | 'output' = 'input';
}

class UpdateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Update${this.modelDefinition.name}Input`;
    }

    protected isExcluded(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetaValue(MetaKey.ExcludeOnUpdate);
    }

    protected isNullable(traversedProperty: TraversedProperty) {
        return !traversedProperty.getMetaValue(MetaKey.RequiredOnUpdate);
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
            name: `${modelDefinition.name}Paginated`,
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
