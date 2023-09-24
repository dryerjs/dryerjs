import * as graphql from 'graphql';
import { AnyClass, ModelDefinition } from './type';
import { CachedPropertiesByModel, MetadataKey } from './metadata';

export class GraphqlTypeBuilder {
    static build(modelDefinition: ModelDefinition) {
        return {
            output: this.getOutputType(modelDefinition),
            create: this.getCreateInputType(modelDefinition),
            update: this.getUpdateInputType(modelDefinition),
        };
    }

    private static traverse(
        modelDefinition: ModelDefinition,
        fn: (property: string, typeInClass: AnyClass) => void,
    ) {
        const instance = new modelDefinition();
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.DesignType,
        )) {
            const typeInClass = Reflect.getMetadata(MetadataKey.DesignType, instance, property);
            fn(property, typeInClass);
        }
    }

    private static getOutputType(modelDefinition: ModelDefinition) {
        const result = {
            name: modelDefinition.name,
            fields: {},
        };

        this.traverse(modelDefinition, (propertyName, typeInClass) => {
            if (
                CachedPropertiesByModel.getMetadataValue(
                    modelDefinition.name,
                    MetadataKey.ExcludeOnOutput,
                    propertyName,
                )
            )   {
                return;
            }
            const typeConfig = {
                String: graphql.GraphQLString,
                Date: graphql.GraphQLString,
                Number: graphql.GraphQLInt,
            };
            result.fields[propertyName] = { type: typeConfig[typeInClass.name] };
        });

        return new graphql.GraphQLNonNull(new graphql.GraphQLObjectType(result));
    }

    private static getCreateInputType(modelDefinition: ModelDefinition) {
        const result = {
            name: `Create${modelDefinition.name}Input`,
            fields: {},
        };

        this.traverse(modelDefinition, (propertyName, typeInClass) => {
            if (
                CachedPropertiesByModel.getMetadataValue(
                    modelDefinition.name,
                    MetadataKey.ExcludeOnCreate,
                    propertyName,
                )
            )   {
                return;
            }
            if (
                CachedPropertiesByModel.getMetadataValue(
                    modelDefinition.name,
                    MetadataKey.ExcludeOnInput,
                    propertyName,
                )
            )   {
                return;
            }
            const typeConfig = {
                String: graphql.GraphQLString,
                Date: graphql.GraphQLString,
                Number: graphql.GraphQLInt,
            };
            result.fields[propertyName] = { type: typeConfig[typeInClass.name] };
        });

        return new graphql.GraphQLInputObjectType(result);
    }

    private static getUpdateInputType(modelDefinition: ModelDefinition) {
        const result = {
            name: `Update${modelDefinition.name}Input`,
            fields: {},
        };

        this.traverse(modelDefinition, (propertyName, typeInClass) => {
            if (
                CachedPropertiesByModel.getMetadataValue(
                    modelDefinition.name,
                    MetadataKey.ExcludeOnUpdate,
                    propertyName,
                )
            )   {
                return;
            }
            if (
                CachedPropertiesByModel.getMetadataValue(
                    modelDefinition.name,
                    MetadataKey.ExcludeOnInput,
                    propertyName,
                )
            )   {
                return;
            }
            const typeConfig = {
                String: graphql.GraphQLString,
                Date: graphql.GraphQLString,
                Number: graphql.GraphQLInt,
            };
            result.fields[propertyName] = { type: typeConfig[typeInClass.name] };
        });

        return new graphql.GraphQLInputObjectType(result);
    }
}
