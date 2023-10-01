import { Schema } from 'mongoose';
import { ModelDefinition } from './type';
import { MetaKey, inspect } from './metadata';
import * as util from './util';

export class MongooseSchemaBuilder {
    public static build(modelDefinition: ModelDefinition, isRoot = true) {
        const result = {};

        for (const property of inspect(modelDefinition).getProperties()) {
            if (property.name === 'id') continue;

            if (property.getMetaValue(MetaKey.ExcludeOnDatabase)) {
                continue;
            }

            const isEmbedded = util.isFunction(property.getMetaValue(MetaKey.Embedded));
            if (isEmbedded) {
                const isEmbeddedArray = property.typeInClass.name === 'Array';
                const subSchema = this.build(property.getMetaValue(MetaKey.Embedded), false);
                result[property.name] = isEmbeddedArray ? [subSchema] : subSchema;
                continue;
            }

            const enumInObject = property.getMetaValue(MetaKey.Enum);
            const typeConfig = {
                String,
                Date,
                Number,
                Boolean,
            };

            if (util.isObject(enumInObject)) {
                const enumValue = Object.values(enumInObject)[0];
                result[property.name] = { type: typeConfig[property.typeInClass.name], enum: enumValue };
                continue;
            }

            result[property.name] = { type: typeConfig[property.typeInClass.name] };
            continue;
        }

        return new Schema(result, isRoot ? { timestamps: true } : {});
    }
}
