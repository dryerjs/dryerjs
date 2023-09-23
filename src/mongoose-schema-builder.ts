import { Schema } from 'mongoose';
import { ModelDefinition } from './type';

export class MongooseSchemaBuilder {
    public static build(modelDefinition: ModelDefinition) {
        const instance = new modelDefinition();

        const result = {};

        for (const propertyName in instance) {
            if (propertyName === 'id') continue;
            const propertyValue = instance[propertyName];
            const typeConfig = {
                String,
                Date,
                Number,
            };
            result[propertyName] = { type: typeConfig[propertyValue.name] };
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
