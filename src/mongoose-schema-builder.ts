import { Schema } from 'mongoose';
import { ModelDefinition } from './type';
import { CachedPropertiesByModel, MetadataKey } from './metadata';

export class MongooseSchemaBuilder {
    public static build(modelDefinition: ModelDefinition, isRoot = true) {
        const instance = new modelDefinition();

        const result = {};

        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.DesignType,
        )) {
            if (property === 'id') continue;

            if (
                CachedPropertiesByModel.getMetadataValue(
                    modelDefinition.name,
                    MetadataKey.ExcludeOnDatabase,
                    property,
                )
            ) {
                continue;
            }
            const typeConfig = {
                String,
                Date,
                Number,
                Boolean,
            };

            const designType = Reflect.getMetadata(MetadataKey.DesignType, instance, property);
            const isEmbedded = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Embedded,
                property,
            );
            if (isEmbedded) {
                result[property] = this.build(designType, false);
                continue;
            }

            const enumInObject = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Enum,
                property,
            );
            if (enumInObject) {
                const enumValue = Object.values(enumInObject)[0];
                result[property] = { type: typeConfig[designType.name], enum: enumValue };
                continue;
            }

            result[property] = { type: typeConfig[designType.name] };
            continue;
        }

        return new Schema(result, isRoot ? { timestamps: true } : {});
    }
}
