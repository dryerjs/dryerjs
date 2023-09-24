import * as graphql from 'graphql';
import { AnyClass, ModelDefinition } from './type';
import { CachedPropertiesByModel, MetadataKey } from './metadata';

class TraversedProperty {
    constructor(
        private modelDefinition: ModelDefinition,
        public name: string,
        public typeInClass: AnyClass,
    ) {}

    public getMetadataValue(key: MetadataKey) {
        return CachedPropertiesByModel.getMetadataValue(this.modelDefinition.name, key, this.name);
    }
}

export class GraphqlTypeBuilder {
    static build(modelDefinition: ModelDefinition) {
        return {
            output: this.getOutputType(modelDefinition),
            create: this.getCreateInputType(modelDefinition),
            update: this.getUpdateInputType(modelDefinition),
        };
    }

    private static traverse(modelDefinition: ModelDefinition, fn: (property: TraversedProperty) => void) {
        const instance = new modelDefinition();
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.DesignType,
        )) {
            const typeInClass = Reflect.getMetadata(MetadataKey.DesignType, instance, property);
            const traversedProperty = new TraversedProperty(modelDefinition, property, typeInClass);
            fn(traversedProperty);
        }
    }

    private static getOutputType(modelDefinition: ModelDefinition) {
        const result = {
            name: modelDefinition.name,
            fields: {},
        };

        this.traverse(modelDefinition, traversedProperty => {
            if (traversedProperty.getMetadataValue(MetadataKey.ExcludeOnOutput)) return;
            const isNullable = traversedProperty.getMetadataValue(MetadataKey.NullableOnOutput);

            result.fields[traversedProperty.name] = {
                type: this.getTypeForOneField(traversedProperty, isNullable),
            };
        });

        return new graphql.GraphQLNonNull(new graphql.GraphQLObjectType(result));
    }

    private static getCreateInputType(modelDefinition: ModelDefinition) {
        const result = {
            name: `Create${modelDefinition.name}Input`,
            fields: {},
        };

        this.traverse(modelDefinition, traversedProperty => {
            if (traversedProperty.getMetadataValue(MetadataKey.ExcludeOnCreate)) return;
            if (traversedProperty.getMetadataValue(MetadataKey.ExcludeOnInput)) return;
            const isNotNull = traversedProperty.getMetadataValue(MetadataKey.NotNullOnCreate);
            result.fields[traversedProperty.name] = {
                type: this.getTypeForOneField(traversedProperty, !isNotNull),
            };
        });

        return new graphql.GraphQLInputObjectType(result);
    }

    private static getTypeForOneField(traversedProperty: TraversedProperty, nullable: boolean) {
        const typeConfig = {
            String: graphql.GraphQLString,
            Date: graphql.GraphQLString,
            Number: graphql.GraphQLFloat,
            Boolean: graphql.GraphQLBoolean,
        };

        const overrideType = traversedProperty.getMetadataValue(MetadataKey.GraphQLType);
        const baseType = overrideType ? overrideType : typeConfig[traversedProperty.typeInClass.name];
        return nullable ? baseType : new graphql.GraphQLNonNull(baseType);
    }

    private static getUpdateInputType(modelDefinition: ModelDefinition) {
        const result = {
            name: `Update${modelDefinition.name}Input`,
            fields: {},
        };

        this.traverse(modelDefinition, traversedProperty => {
            if (traversedProperty.getMetadataValue(MetadataKey.ExcludeOnUpdate)) return;
            if (traversedProperty.getMetadataValue(MetadataKey.ExcludeOnInput)) return;
            const isNotNull = traversedProperty.getMetadataValue(MetadataKey.NotNullOnUpdate);
            result.fields[traversedProperty.name] = {
                type: this.getTypeForOneField(traversedProperty, !isNotNull),
            };
        });

        return new graphql.GraphQLInputObjectType(result);
    }
}
