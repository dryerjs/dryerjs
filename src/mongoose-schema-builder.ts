import { Schema } from 'mongoose';
import { ModelDefinition } from './type';
import { MetadataKey, inspect } from './metadata';

export class MongooseSchemaBuilder {
    public static build(modelDefinition: ModelDefinition, isRoot = true) {
        const instance = new modelDefinition();

        const result = {};

        for (const property of inspect(modelDefinition).getProperties()) {
            if (property.name === 'id') continue;

            if (property.getMetadataValue(MetadataKey.ExcludeOnDatabase)) {
                continue;
            }
            const typeConfig = {
                String,
                Date,
                Number,
                Boolean,
            };

            const designType = Reflect.getMetadata(MetadataKey.DesignType, instance, property.name);
            const isEmbedded = typeof property.getMetadataValue(MetadataKey.Embedded) === 'function';
            if (isEmbedded) {
                result[property.name] = this.build(designType, false);
                continue;
            }

            const enumInObject = property.getMetadataValue(MetadataKey.Enum);
            if (enumInObject) {
                const enumValue = Object.values(enumInObject)[0];
                result[property.name] = { type: typeConfig[designType.name], enum: enumValue };
                continue;
            }

            result[property.name] = { type: typeConfig[designType.name] };
            continue;
        }

        return new Schema(result, isRoot ? { timestamps: true } : {});
    }
}
