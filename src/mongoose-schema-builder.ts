import { Schema } from 'mongoose';
import { ModelDefinition } from './type';
import { CachedPropertiesByModel } from './property';

export class MongooseSchemaBuilder {
    public static build(modelDefinition: ModelDefinition) {
        const instance = new modelDefinition();

        const result = {};

        for (const property of CachedPropertiesByModel.getPropertiesByModel(modelDefinition.name)) {
            if (property === 'id') continue;
            const typeConfig = {
                String,
                Date,
                Number,
            };
            result[property] = {
                type: typeConfig[Reflect.getMetadata('design:type', instance, property).name],
            };
        }

        return new Schema(result, {
            virtuals: {
                id: {
                    get: function () {
                        return this._id.toString();
                    },
                },
            },
        });
    }
}
