import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { Property } from './property';
import { ApiType, SchemaOptions } from './shared';

const INSTANCE_KEY = Symbol('inspectable_instance');

export function inspect(modelDefinition: any) {
    modelDefinition[INSTANCE_KEY] = util.defaultTo(modelDefinition[INSTANCE_KEY], new modelDefinition());
    const instance = modelDefinition[INSTANCE_KEY];

    return {
        getProperties(metaKey: MetaKey = MetaKey.DesignType) {
            const result: Property[] = [];
            for (const propertyName in Metadata.getPropertiesByModel(modelDefinition, metaKey)) {
                const designType = Reflect.getMetadata(MetaKey.DesignType, instance, propertyName);
                const paramTypes = Reflect.getMetadata(MetaKey.ParamTypes, instance, propertyName);
                const returnType = Reflect.getMetadata(MetaKey.ReturnType, instance, propertyName);

                const property = new Property(
                    modelDefinition,
                    propertyName,
                    designType,
                    paramTypes,
                    returnType,
                );
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
}
