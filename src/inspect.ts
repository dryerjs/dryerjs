import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { Property } from './property';
import { ApiType, SchemaOptions } from './shared';

const INSPECTED = Symbol('inspected');
const CACHED_PROPERTIES = Symbol('cached_properties');

function inspectWithoutCache(modelDefinition: any) {
    return {
        [CACHED_PROPERTIES]: {},
        getProperties(metaKey: MetaKey = MetaKey.DesignType): Property[] {
            if (this[CACHED_PROPERTIES][metaKey]) return this[CACHED_PROPERTIES][metaKey];
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
            this[CACHED_PROPERTIES][metaKey] = result;
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
}

export function inspect(modelDefinition: any): ReturnType<typeof inspectWithoutCache> {
    if (modelDefinition[INSPECTED]) return modelDefinition[INSPECTED];
    const result = inspectWithoutCache(modelDefinition);
    modelDefinition[INSPECTED] = result;
    return modelDefinition[INSPECTED];
}
