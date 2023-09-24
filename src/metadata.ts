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
        value: any = true,
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
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnInput,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnCreate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnCreate,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnUpdate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnUpdate,
            propertyKey,
            fn,
        );
    };
}

export function Validate(fn: (field: any, object: any, ctx: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.Validate, propertyKey, fn);
    };
}

export function ExcludeOnOutput() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.ExcludeOnOutput,
            propertyKey,
        );
    };
}

export function ExcludeOnInput() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.ExcludeOnInput,
            propertyKey,
        );
    };
}

export function ExcludeOnCreate() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.ExcludeOnCreate,
            propertyKey,
        );
    };
}

export function ExcludeOnUpdate() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.ExcludeOnUpdate,
            propertyKey,
        );
    };
}
