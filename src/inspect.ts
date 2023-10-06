import { MetaKey, Metadata } from './metadata';
import { Property } from './property';

export function inspect(modelDefinition: any) {
    const INSTANCE_KEY = '__inspectable_instance';
    modelDefinition[INSTANCE_KEY] = modelDefinition[INSTANCE_KEY] || new modelDefinition();
    const instance = modelDefinition[INSTANCE_KEY];

    return {
        getProperties(metaKey: MetaKey = MetaKey.DesignType) {
            const result: Property[] = [];
            for (const propertyName in Metadata.getPropertiesByModel(modelDefinition.name, metaKey)) {
                const typeInClass = Reflect.getMetadata(MetaKey.DesignType, instance, propertyName);
                const property = new Property(modelDefinition, propertyName, typeInClass);
                result.push(property);
            }
            return result;
        },
        getEmbeddedProperties(): Property[] {
            return this.getProperties(MetaKey.Embedded);
        },
    };
}
