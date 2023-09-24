import 'reflect-metadata';

export enum MetadataKey {
    DesignType = 'design:type',
    TransformOnOutput = 'TransformOnOutput',
    TransformOnInput = 'TransformOnInput',
    TransformOnCreate = 'TransformOnCreate',
    TransformOnUpdate = 'TransformOnUpdate',
    Validate = 'Validate',
    ExcludeOnOutput = 'ExcludeOnOutput',
    ExcludeOnInput = 'ExcludeOnInput',
    ExcludeOnCreate = 'ExcludeOnCreate',
    ExcludeOnUpdate = 'ExcludeOnUpdate',
}

export class CachedPropertiesByModel {
    private static propertiesByModel: {
        [modelName: string]: { [metaKey: string]: { [fieldName: string]: any } };
    } = {};

    public static getPropertiesByModel(
        modelName: string,
        metaKey: MetadataKey,
    ): { [fieldName: string]: any } {
        return this.propertiesByModel[modelName][metaKey] || {};
    }

    public static getMetadataValue(modelName: string, metaKey: MetadataKey, fieldName: string): any {
        return this.propertiesByModel[modelName]?.[metaKey]?.[fieldName];
    }

    public static addField(
        modelName: string,
        metaKey: MetadataKey,
        fieldName: string,
        value: any = undefined,
    ): void {
        if (this.propertiesByModel[modelName] === undefined) {
            this.propertiesByModel[modelName] = {};
        }
        if (this.propertiesByModel[modelName][metaKey] === undefined) {
            this.propertiesByModel[modelName][metaKey] = {};
        }
        this.propertiesByModel[modelName][metaKey][fieldName] = value;
    }
}

export function Property() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.DesignType, propertyKey);
    };
}

export function TransformOnOutput(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnOutput,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnInput(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.TransformOnInput, propertyKey);
        Reflect.defineMetadata(MetadataKey.TransformOnInput, fn, target, propertyKey);
    };
}

export function TransformOnCreate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.TransformOnCreate, propertyKey);
        Reflect.defineMetadata(MetadataKey.TransformOnCreate, fn, target, propertyKey);
    };
}

export function TransformOnUpdate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.TransformOnUpdate, propertyKey);
        Reflect.defineMetadata(MetadataKey.TransformOnUpdate, fn, target, propertyKey);
    };
}

export function Validate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.Validate, propertyKey);
        Reflect.defineMetadata(MetadataKey.Validate, fn, target, propertyKey);
    };
}

export function ExcludeOnOutput(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnOutput, propertyKey);
        Reflect.defineMetadata(MetadataKey.ExcludeOnOutput, fn, target, propertyKey);
    };
}

export function ExcludeOnInput(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnInput, propertyKey);
        Reflect.defineMetadata(MetadataKey.ExcludeOnInput, fn, target, propertyKey);
    };
}

export function ExcludeOnCreate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnCreate, propertyKey);
        Reflect.defineMetadata(MetadataKey.ExcludeOnCreate, fn, target, propertyKey);
    };
}

export function ExcludeOnUpdate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnUpdate, propertyKey);
        Reflect.defineMetadata(MetadataKey.ExcludeOnUpdate, fn, target, propertyKey);
    };
}
