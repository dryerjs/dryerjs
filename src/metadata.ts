import 'reflect-metadata';
import * as util from './util';
import { Relation, RelationKind, TargetClass } from './shared';

export enum MetaKey {
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
    DatabaseType = 'DatabaseType',
    Enum = 'Enum',
    Embedded = 'Embedded',
    Relation = 'Relation',
    ScalarArrayType = 'ScalarArrayType',
}

type AnyEnum = { [key: string]: any };
type MetaValue = any;

export type Ref<T> = T;

export class Metadata {
    private static propertiesByModel: {
        [modelName: string]: { [metaKey: string]: { [property: string]: MetaValue } };
    } = {};

    public static getPropertiesByModel(
        modelName: string,
        metaKey: MetaKey,
    ): { [property: string]: MetaValue } {
        return this.propertiesByModel[modelName][metaKey] || {};
    }

    public static getMetaValue(modelName: string, metaKey: MetaKey, property: string): MetaValue {
        return this.propertiesByModel[modelName]?.[metaKey]?.[property];
    }

    public static addProperty(
        modelName: string,
        metaKey: MetaKey,
        property: string,
        value: MetaValue = true,
    ): void {
        if (util.isUndefined(this.propertiesByModel[modelName])) {
            this.propertiesByModel[modelName] = {};
        }
        if (util.isUndefined(this.propertiesByModel[modelName][metaKey])) {
            this.propertiesByModel[modelName][metaKey] = {};
        }
        this.propertiesByModel[modelName][metaKey][property] = value;
    }

    public static cleanOnTest() {
        this.propertiesByModel = {};
    }
}

export function Property(options: { enum?: AnyEnum; type?: TargetClass } = {}) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.DesignType, propertyKey);
        if (util.isNotNullObject(options.enum)) {
            if (Object.keys(options.enum).length !== 1) {
                const message = `Enum should be defined as an object. Example: @Property({ enum: { UserStatus })`;
                throw new Error(message);
            }
            Metadata.addProperty(target.constructor.name, MetaKey.Enum, propertyKey, options.enum);
        }
        if (util.isFunction(options.type)) {
            Metadata.addProperty(target.constructor.name, MetaKey.ScalarArrayType, propertyKey, options.type);
        }
    };
}

export function EmbeddedProperty(options: { type: TargetClass }) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        Metadata.addProperty(target.constructor.name, MetaKey.Embedded, propertyKey, options.type);
    };
}

type TransformFunction = (value: any, ctx: any, object: any) => any;

export function TransformOnOutput(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.TransformOnOutput, propertyKey, fn);
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
        Metadata.addProperty(target.constructor.name, MetaKey.TransformOnCreate, propertyKey, fn);
    };
}

export function TransformOnUpdate(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.TransformOnUpdate, propertyKey, fn);
    };
}

type DefaultFunction = (ctx: any, object: any) => any;

export function DefaultOnOutput(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.DefaultOnOutput, propertyKey, fn);
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
        Metadata.addProperty(target.constructor.name, MetaKey.DefaultOnCreate, propertyKey, fn);
    };
}

export function DefaultOnUpdate(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.DefaultOnUpdate, propertyKey, fn);
    };
}

type ValidateFunction = (value: any, ctx: any, object: any) => any;

export function Validate(fn: ValidateFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.Validate, propertyKey, fn);
    };
}

export function ExcludeOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.ExcludeOnOutput, propertyKey);
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
        Metadata.addProperty(target.constructor.name, MetaKey.ExcludeOnCreate, propertyKey);
    };
}

export function ExcludeOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.ExcludeOnUpdate, propertyKey);
    };
}

export function RequiredOnCreate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.RequiredOnCreate, propertyKey);
    };
}

export function RequiredOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.RequiredOnUpdate, propertyKey);
    };
}

export function ExcludeOnDatabase() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.ExcludeOnDatabase, propertyKey);
    };
}

export function NullableOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.NullableOnOutput, propertyKey);
    };
}

export function GraphQLType(type: any) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.GraphQLType, propertyKey, type);
    };
}

export function DatabaseType(type: any) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.DatabaseType, propertyKey, type);
    };
}

export function HasMany(options: { type: TargetClass; from?: string; to: string }) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        ExcludeOnUpdate()(target, propertyKey);
        ExcludeOnDatabase()(target, propertyKey);
        const relation: Relation = {
            ...options,
            kind: RelationKind.HasMany,
            from: util.defaultTo(options.from, '_id'),
        };
        Metadata.addProperty(target.constructor.name, MetaKey.Relation, propertyKey, relation);
    };
}

export function BelongsTo(options: { type: TargetClass; from: string; to?: string }) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        ExcludeOnInput()(target, propertyKey);
        ExcludeOnDatabase()(target, propertyKey);
        const relation: Relation = {
            ...options,
            kind: RelationKind.BelongsTo,
            to: util.defaultTo(options.to, '_id'),
        };
        Metadata.addProperty(target.constructor.name, MetaKey.Relation, propertyKey, relation);
    };
}

export function HasOne(options: { type: TargetClass; from?: string; to: string }) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        ExcludeOnUpdate()(target, propertyKey);
        ExcludeOnDatabase()(target, propertyKey);
        const relation: Relation = {
            ...options,
            kind: RelationKind.HasOne,
            from: util.defaultTo(options.from, '_id'),
        };
        Metadata.addProperty(target.constructor.name, MetaKey.Relation, propertyKey, relation);
    };
}

export function ReferencesMany(options: { type: TargetClass; from: string; to?: string }) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        ExcludeOnInput()(target, propertyKey);
        ExcludeOnDatabase()(target, propertyKey);
        const relation: Relation = {
            ...options,
            kind: RelationKind.ReferencesMany,
            to: util.defaultTo(options.to, '_id'),
        };
        Metadata.addProperty(target.constructor.name, MetaKey.Relation, propertyKey, relation);
    };
}
