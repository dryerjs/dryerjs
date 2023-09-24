import 'reflect-metadata';

export enum MetadataKey {
    DesignType = 'design:type',
    TransformOnOutput = 'TransformOnOutput',
    TransformOnInput = 'TransformOnInput',
    TransformOnCreate = 'TransformOnCreate',
    TransformOnUpdate = 'TransformOnUpdate',
    Validate = 'Validate',
    DefaultOnInput = 'DefaultOnInput',
    DefaultOnCreate = 'DefaultOnCreate',
    DefaultOnUpdate = 'DefaultOnUpdate',
    DefaultOnOutput = 'DefaultOnOutput',
    ExcludeOnOutput = 'ExcludeOnOutput',
    ExcludeOnInput = 'ExcludeOnInput',
    ExcludeOnCreate = 'ExcludeOnCreate',
    ExcludeOnUpdate = 'ExcludeOnUpdate',
    ExcludeOnDatabase = 'ExcludeOnDatabase',
    NotNullOnCreate = 'NotNullOnCreate',
    NotNullOnUpdate = 'NotNullOnUpdate',
    NullableOnOutput = 'NullableOnOutput',
    GraphQLType = 'GraphQLType',
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

export function TransformOnOutput(fn: (fieldValue: any, ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnOutput,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnInput(fn: (fieldValue: any, ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnInput,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnCreate(fn: (fieldValue: any, ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnCreate,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnUpdate(fn: (fieldValue: any, ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnUpdate,
            propertyKey,
            fn,
        );
    };
}

export function DefaultOnOutput(fn: (ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.DefaultOnOutput,
            propertyKey,
            fn,
        );
    };
}

export function DefaultOnInput(fn: (ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.DefaultOnInput,
            propertyKey,
            fn,
        );
    };
}

export function DefaultOnCreate(fn: (ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.DefaultOnCreate,
            propertyKey,
            fn,
        );
    };
}

export function DefaultOnUpdate(fn: (ctx: any, object: any) => any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.DefaultOnUpdate,
            propertyKey,
            fn,
        );
    };
}

export function Validate(fn: (fieldValue: any, ctx: any, object: any) => any) {
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

export function NotNullOnCreate() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.NotNullOnCreate,
            propertyKey,
        );
    };
}

export function NotNullOnUpdate() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.NotNullOnUpdate,
            propertyKey,
        );
    };
}

export function ExcludeOnDatabase() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.ExcludeOnDatabase,
            propertyKey,
        );
    };
}

export function NullableOnOutput() {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.NullableOnOutput,
            propertyKey,
        );
    };
}

export function GraphQLType(type: any) {
    return function (target: any, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.GraphQLType,
            propertyKey,
            type,
        );
    };
}
