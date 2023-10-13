import 'reflect-metadata';
import * as util from './util';
import {
    EmbeddedSchemaOptions,
    SchemaOptions,
    Relation,
    RelationKind,
    TargetClass,
    FilterableOptions,
} from './shared';

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
    Schema = 'Schema',
    Filterable = 'Filterable',
}

type AnyEnum = { [key: string]: any };
type MetaValue = any;

export type Ref<T> = T;

const METADATA = Symbol('metadata');
const MODEL_KEY = Symbol('modelKey');

export class Metadata {
    public static getPropertiesByModel(
        target: TargetClass,
        metaKey: MetaKey,
    ): { [property: string]: MetaValue } {
        return util.defaultTo(target[METADATA]?.[metaKey], {});
    }

    public static getMetaValue(target: TargetClass, metaKey: MetaKey, property: string | symbol): MetaValue {
        return target[METADATA]?.[metaKey]?.[property];
    }

    public static addProperty(
        target: TargetClass,
        metaKey: MetaKey,
        property: string | symbol,
        value: MetaValue = true,
    ): void {
        const constructor = typeof target === 'function' ? target : target.constructor;
        if (util.isUndefined(constructor[METADATA])) {
            constructor[METADATA] = {};
        }
        if (util.isUndefined(constructor[METADATA][metaKey])) {
            constructor[METADATA][metaKey] = {};
        }
        constructor[METADATA][metaKey][property] = value;
    }

    public static getModelMetaValue(target: TargetClass, metaKey: MetaKey): MetaValue {
        return this.getMetaValue(target, metaKey, MODEL_KEY);
    }

    public static addModelProperty(target: TargetClass, metaKey: MetaKey, value: MetaValue): void {
        this.addProperty(target, metaKey, MODEL_KEY, value);
    }
}

export function Property(options: { enum?: AnyEnum; type?: TargetClass } = {}) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.DesignType, propertyKey);
        if (util.isNotNullObject(options.enum)) {
            if (Object.keys(options.enum).length !== 1) {
                const message = `Enum should be defined as an object. Example: @Property({ enum: { UserStatus })`;
                throw new Error(message);
            }
            Metadata.addProperty(target, MetaKey.Enum, propertyKey, options.enum);
        }
        if (util.isFunction(options.type)) {
            Metadata.addProperty(target, MetaKey.ScalarArrayType, propertyKey, options.type);
        }
    };
}

export function Schema(options: SchemaOptions) {
    return function (target: TargetClass) {
        Metadata.addModelProperty(target, MetaKey.Schema, options);
    };
}

export function EmbeddedProperty(options: EmbeddedSchemaOptions) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        Metadata.addProperty(target, MetaKey.Embedded, propertyKey, options);
    };
}

type TransformFunction = (value: any, ctx: any, object: any) => any;

export function TransformOnOutput(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.TransformOnOutput, propertyKey, fn);
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
        Metadata.addProperty(target, MetaKey.TransformOnCreate, propertyKey, fn);
    };
}

export function TransformOnUpdate(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.TransformOnUpdate, propertyKey, fn);
    };
}

type DefaultFunction = (ctx: any, object: any) => any;

export function DefaultOnOutput(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.DefaultOnOutput, propertyKey, fn);
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
        Metadata.addProperty(target, MetaKey.DefaultOnCreate, propertyKey, fn);
    };
}

export function DefaultOnUpdate(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.DefaultOnUpdate, propertyKey, fn);
    };
}

type ValidateFunction = (value: any, ctx: any, object: any) => any;

export function Validate(fn: ValidateFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.Validate, propertyKey, fn);
    };
}

export function ExcludeOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.ExcludeOnOutput, propertyKey);
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
        Metadata.addProperty(target, MetaKey.ExcludeOnCreate, propertyKey);
    };
}

export function ExcludeOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.ExcludeOnUpdate, propertyKey);
    };
}

export function RequiredOnCreate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.RequiredOnCreate, propertyKey);
    };
}

export function RequiredOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.RequiredOnUpdate, propertyKey);
    };
}

export function ExcludeOnDatabase() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.ExcludeOnDatabase, propertyKey);
    };
}

export function NullableOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.NullableOnOutput, propertyKey);
    };
}

export function GraphQLType(type: any) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.GraphQLType, propertyKey, type);
    };
}

export function DatabaseType(type: any) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target, MetaKey.DatabaseType, propertyKey, type);
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
        Metadata.addProperty(target, MetaKey.Relation, propertyKey, relation);
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
        Metadata.addProperty(target, MetaKey.Relation, propertyKey, relation);
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
        Metadata.addProperty(target, MetaKey.Relation, propertyKey, relation);
    };
}

export function ReferencesMany(options: { type: TargetClass; from: string; to?: string }) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        ExcludeOnUpdate()(target, propertyKey);
        ExcludeOnDatabase()(target, propertyKey);
        const relation: Relation = {
            ...options,
            kind: RelationKind.ReferencesMany,
            to: util.defaultTo(options.to, '_id'),
        };
        Metadata.addProperty(target, MetaKey.Relation, propertyKey, relation);
    };
}

export function Filterable(options: FilterableOptions) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        Metadata.addProperty(target, MetaKey.Filterable, propertyKey, options);
    };
}
