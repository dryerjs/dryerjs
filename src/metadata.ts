import 'reflect-metadata';

export enum MetadataKey {
    DesignType = 'design:type',
    TransformOnOutput = 'TransformOnOutput',
    TransformOnCreate = 'TransformOnCreate',
    TransformOnUpdate = 'TransformOnUpdate',
    Validate = 'Validate',
    DefaultOnCreate = 'DefaultOnCreate',
    DefaultOnUpdate = 'DefaultOnUpdate',
    DefaultOnOutput = 'DefaultOnOutput',
    ExcludeOnOutput = 'ExcludeOnOutput',
    ExcludeOnCreate = 'ExcludeOnCreate',
    ExcludeOnUpdate = 'ExcludeOnUpdate',
    ExcludeOnDatabase = 'ExcludeOnDatabase',
    RequiredOnCreate = 'RequiredOnCreate',
    RequiredOnUpdate = 'RequiredOnUpdate',
    NullableOnOutput = 'NullableOnOutput',
    GraphQLType = 'GraphQLType',
    Enum = 'Enum',
    Embedded = 'Embedded',
}

type TargetClass = any;
type AnyEnum = { [key: string]: any };
type MetadataValue = any;

export class CachedPropertiesByModel {
    private static propertiesByModel: {
        [modelName: string]: { [metaKey: string]: { [fieldName: string]: MetadataValue } };
    } = {};

    public static getPropertiesByModel(
        modelName: string,
        metaKey: MetadataKey,
    ): { [fieldName: string]: MetadataValue } {
        return this.propertiesByModel[modelName][metaKey] || {};
    }

    public static getMetadataValue(
        modelName: string,
        metaKey: MetadataKey,
        fieldName: string,
    ): MetadataValue {
        return this.propertiesByModel[modelName]?.[metaKey]?.[fieldName];
    }

    public static addField(
        modelName: string,
        metaKey: MetadataKey,
        fieldName: string,
        value: MetadataValue = true,
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

export function Property(options: { enum?: AnyEnum } = {}) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.DesignType, propertyKey);
        if (options.enum) {
            if (Object.keys(options.enum).length !== 1) {
                const message = `Enum should be defined as an object. Example: @Property({ enum: { UserStatus })`;
                throw new Error(message);
            }
            CachedPropertiesByModel.addField(
                target.constructor.name,
                MetadataKey.Enum,
                propertyKey,
                options.enum,
            );
        }
    };
}

export function EmbeddedProperty(options: { type: TargetClass }) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.Embedded,
            propertyKey,
            options.type,
        );
    };
}

type TransformFunction = (fieldValue: any, ctx: any, object: any) => any;

export function TransformOnOutput(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnOutput,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnInput(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        TransformOnCreate(fn)(target, propertyKey);
        TransformOnUpdate(fn)(target, propertyKey);
    };
}

export function TransformOnCreate(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnCreate,
            propertyKey,
            fn,
        );
    };
}

export function TransformOnUpdate(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.TransformOnUpdate,
            propertyKey,
            fn,
        );
    };
}

type DefaultFunction = (ctx: any, object: any) => any;

export function DefaultOnOutput(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.DefaultOnOutput,
            propertyKey,
            fn,
        );
    };
}

export function DefaultOnInput(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        DefaultOnCreate(fn)(target, propertyKey);
        DefaultOnUpdate(fn)(target, propertyKey);
    };
}

export function DefaultOnCreate(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.DefaultOnCreate,
            propertyKey,
            fn,
        );
    };
}

export function DefaultOnUpdate(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(
            target.constructor.name,
            MetadataKey.DefaultOnUpdate,
            propertyKey,
            fn,
        );
    };
}

type ValidateFunction = (fieldValue: any, ctx: any, object: any) => any;

export function Validate(fn: ValidateFunction) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.Validate, propertyKey, fn);
    };
}

export function ExcludeOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnOutput, propertyKey);
    };
}

export function ExcludeOnInput() {
    return function (target: TargetClass, propertyKey: string) {
        ExcludeOnCreate()(target, propertyKey);
        ExcludeOnUpdate()(target, propertyKey);
    };
}

export function ExcludeOnCreate() {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnCreate, propertyKey);
    };
}

export function ExcludeOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnUpdate, propertyKey);
    };
}

export function RequiredOnCreate() {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.RequiredOnCreate, propertyKey);
    };
}

export function RequiredOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.RequiredOnUpdate, propertyKey);
    };
}

export function ExcludeOnDatabase() {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.ExcludeOnDatabase, propertyKey);
    };
}

export function NullableOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.NullableOnOutput, propertyKey);
    };
}

export function GraphQLType(type: any) {
    return function (target: TargetClass, propertyKey: string) {
        CachedPropertiesByModel.addField(target.constructor.name, MetadataKey.GraphQLType, propertyKey, type);
    };
}
