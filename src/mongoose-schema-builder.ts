import { Schema } from 'mongoose';
import { ModelDefinition, ObjectId, RelationKind } from './shared';
import { MetaKey } from './metadata';
import * as util from './util';
import { inspect } from './inspect';

export class MongooseSchemaBuilder {
    public static build(modelDefinition: ModelDefinition, isRoot = true) {
        const result = {};

        for (const property of inspect(modelDefinition).getProperties()) {
            if (property.name === 'id') continue;

            if (property.getMetaValue(MetaKey.ExcludeOnDatabase)) {
                continue;
            }

            if (property.isEmbedded()) {
                const subSchema = this.build(property.getEmbeddedModelDefinition(), false);
                result[property.name] = property.isArray() ? [subSchema] : subSchema;
                continue;
            }

            const databaseType = property.getMetaValue(MetaKey.DatabaseType);
            if (util.isFunction(databaseType)) {
                result[property.name] = property.isArray()
                    ? [{ type: databaseType }]
                    : { type: databaseType };
                continue;
            }

            const typeConfig = {
                String,
                Date,
                Number,
                Boolean,
                ObjectId,
            };

            const scalarArrayType = property.isArray() && property.getMetaValue(MetaKey.ScalarArrayType);
            if (scalarArrayType) {
                result[property.name] = [typeConfig[scalarArrayType.name]];
                continue;
            }

            const enumInObject = property.getMetaValue(MetaKey.Enum);
            if (util.isObject(enumInObject)) {
                const enumValue = Object.values(enumInObject)[0];
                const StringOrNumber = util.isEnumOfNumbers(enumValue) ? Number : String;
                result[property.name] = property.isArray()
                    ? { type: [StringOrNumber], enum: enumValue }
                    : { type: StringOrNumber, enum: enumValue };
                continue;
            }

            result[property.name] = { type: typeConfig[property.designType.name] };
        }

        for (const property of inspect(modelDefinition).getRelationProperties()) {
            const relation = property.getRelation();
            if (relation.kind === RelationKind.BelongsTo) {
                result[relation.from] = { type: ObjectId };
                continue;
            }
        }
        return new Schema(result, isRoot ? { timestamps: true } : {});
    }
}
