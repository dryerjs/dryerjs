import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { Property } from './property';
import { ApiType, SchemaOptions } from './shared';

const INSPECTED = Symbol('inspected');

export function inspect(modelDefinition: any) {
    if (modelDefinition[INSPECTED]) return modelDefinition[INSPECTED];
    const result = {
        getProperties(metaKey: MetaKey = MetaKey.DesignType) {
            const result: Property[] = [];
            for (const propertyName in Metadata.getPropertiesByModel(modelDefinition, metaKey)) {
                const designType = Reflect.getMetadata(
                    MetaKey.DesignType,
                    modelDefinition.prototype,
                    propertyName,
                );
                const paramTypes = Reflect.getMetadata(
                    MetaKey.ParamTypes,
                    modelDefinition.prototype,
                    propertyName,
                );

                const property = new Property(modelDefinition, propertyName, designType, paramTypes);
                result.push(property);
            }
            return result;
        },
        getEmbeddedProperties(): Property[] {
            return this.getProperties(MetaKey.Embedded);
        },
        getRelationProperties(): Property[] {
            return this.getProperties(MetaKey.Relation);
        },
        isApiExcluded(apiType: ApiType): boolean {
            const schemaOptions: SchemaOptions = Metadata.getModelMetaValue(modelDefinition, MetaKey.Schema);
            return util.defaultTo(schemaOptions?.excluded, []).includes(apiType);
        },
    };
    modelDefinition[INSPECTED] = result;
    return modelDefinition[INSPECTED];
}
