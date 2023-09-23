import 'reflect-metadata';

export class CachedPropertiesByModel {
    private static propertiesByModel: { [key: string]: string[] } = {};

    public static getPropertiesByModel(modelName: string): string[] {
        return this.propertiesByModel[modelName] || [];
    }

    public static addField(modelName: string, fieldName: string): void {
        this.propertiesByModel[modelName] = this.propertiesByModel[modelName] || [];
        if (this.propertiesByModel[modelName].includes(fieldName)) return;
        this.propertiesByModel[modelName].push(fieldName);
    }
}

export function Property() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, propertyKey);
    };
}

export function Transform() {
    return function (target: any, propertyKey: string) {
        const propertyType = Reflect.defineMetadata('transform', target, propertyKey);
        target[propertyKey] = propertyType;
    };
}
