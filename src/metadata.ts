import 'reflect-metadata';
import * as util from './util';
import {
    EmbeddedSchemaOptions,
    SchemaOptions,
    Relation,
    RelationKind,
    TargetClass,
    FilterableOptions,
    Argument,
    ClassType,
    ApiOptions,
} from './shared';
import { IndexDefinition, IndexOptions } from 'mongoose';

export enum MetaKey {
    DesignType = 'design:type',
    ParamTypes = 'design:paramtypes',
    ReturnType = 'design:returntype',
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
    Index = 'Index',
    Filterable = 'Filterable',
    Sortable = 'Sortable',
    Resolver = 'Resolver',
    Api = 'Api',
    Arg = 'Arg',
    InputTypeInheritMode = 'InputTypeInheritMode',
}

type AnyEnum = { [key: string]: any };
type MetaValue = any;

export type Ref<T> = T;

const METADATA = Symbol('metadata');
const MODEL_KEY = Symbol('model_key');

export class Metadata {
    public static getPropertiesByModel(
        target: TargetClass,
        metaKey: MetaKey,
    ): { [property: string]: MetaValue } {
        const result = {};
        for (const property of Object.keys(util.defaultTo(target[METADATA], []))) {
            const value = this.getMetaValue(target, metaKey, property);
            if (util.isUndefined(value)) continue;
            result[property] = value;
        }
        return result;
    }

    public static getMetaValue(target: TargetClass, metaKey: MetaKey, property: string | symbol): MetaValue {
        const constructor = typeof target === 'function' ? target : target.constructor;
        return constructor[METADATA]?.[property]?.[metaKey];
    }

    public static unsetProperty(
        target: TargetClass,
        metaKey: MetaKey,
        property: string | symbol
    ): void {
        const constructor = typeof target === 'function' ? target : target.constructor;
        if (util.isUndefined(constructor[METADATA][property][metaKey])) {
            constructor[METADATA][property][metaKey] = undefined;
        }
    }

    public static setProperty(
        target: TargetClass,
        metaKey: MetaKey,
        property: string | symbol,
        value: MetaValue = true,
    ): void {
        const constructor = typeof target === 'function' ? target : target.constructor;
        if (util.isUndefined(constructor[METADATA])) {
            constructor[METADATA] = {};
        }
        if (util.isUndefined(constructor[METADATA][property])) {
            constructor[METADATA][property] = {};
        }
        constructor[METADATA][property][metaKey] = value;
    }

    public static copyProperty(from: TargetClass, to: TargetClass, property: string | symbol): void {
        if (util.isUndefined(to[METADATA])) to[METADATA] = {};
        to[METADATA][property] = from[METADATA]?.[property];
    }

    public static addArgs(target: TargetClass, property: string | symbol, argument: Argument): void {
        const current = util.defaultTo(Metadata.getMetaValue(target, MetaKey.Arg, property), []);
        Metadata.setProperty(target, MetaKey.Arg, property, [...current, argument]);
    }

    public static getModelMetaValue(target: TargetClass, metaKey: MetaKey): MetaValue {
        return this.getMetaValue(target, metaKey, MODEL_KEY);
    }

    public static setModelProperty(target: TargetClass, metaKey: MetaKey, value: MetaValue): void {
        this.setProperty(target, metaKey, MODEL_KEY, value);
    }
}

export function Property(options: { enum?: AnyEnum; type?: TargetClass } = {}) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.DesignType, propertyKey);
        if (util.isNotNullObject(options.enum)) {
            if (Object.keys(options.enum).length !== 1) {
                const message = `Enum should be defined as an object. Example: @Property({ enum: { UserStatus })`;
                throw new Error(message);
            }
            Metadata.setProperty(target, MetaKey.Enum, propertyKey, options.enum);
        }
        if (util.isFunction(options.type)) {
            Metadata.setProperty(target, MetaKey.ScalarArrayType, propertyKey, options.type);
        }
    };
}

export function Schema(options: SchemaOptions) {
    return function (target: TargetClass) {
        Metadata.setModelProperty(target, MetaKey.Schema, options);
    };
}

export function Index(fields: IndexDefinition, options?: IndexOptions) {
    return function (target: TargetClass) {
        const indexOptions = util.defaultTo(Metadata.getModelMetaValue(target, MetaKey.Index), []);
        Metadata.setModelProperty(target, MetaKey.Index, [...indexOptions, { fields, options }]);
    };
}

export function EmbeddedProperty(options: EmbeddedSchemaOptions) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        Metadata.setProperty(target, MetaKey.Embedded, propertyKey, options);
    };
}

type TransformFunction = (value: any, ctx: any, object: any) => any;

export function TransformOnOutput(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.TransformOnOutput, propertyKey, fn);
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
        Metadata.setProperty(target, MetaKey.TransformOnCreate, propertyKey, fn);
    };
}

export function TransformOnUpdate(fn: TransformFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.TransformOnUpdate, propertyKey, fn);
    };
}

type DefaultFunction = (ctx: any, object: any) => any;

export function DefaultOnOutput(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.DefaultOnOutput, propertyKey, fn);
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
        Metadata.setProperty(target, MetaKey.DefaultOnCreate, propertyKey, fn);
    };
}

export function DefaultOnUpdate(fn: DefaultFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.DefaultOnUpdate, propertyKey, fn);
    };
}

type ValidateFunction = (value: any, ctx: any, object: any) => any;

export function Validate(fn: ValidateFunction) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.Validate, propertyKey, fn);
    };
}

export function ExcludeOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.ExcludeOnOutput, propertyKey);
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
        Metadata.setProperty(target, MetaKey.ExcludeOnCreate, propertyKey);
    };
}

export function ExcludeOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.ExcludeOnUpdate, propertyKey);
    };
}

export function RequiredOnCreate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.RequiredOnCreate, propertyKey);
    };
}

export function RequiredOnUpdate() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.RequiredOnUpdate, propertyKey);
    };
}

export function ExcludeOnDatabase() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.ExcludeOnDatabase, propertyKey);
    };
}

export function NullableOnOutput() {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.NullableOnOutput, propertyKey);
    };
}

export function GraphQLType(type: any) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.GraphQLType, propertyKey, type);
    };
}

export function DatabaseType(type: any) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.setProperty(target, MetaKey.DatabaseType, propertyKey, type);
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
        Metadata.setProperty(target, MetaKey.Relation, propertyKey, relation);
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
        Metadata.setProperty(target, MetaKey.Relation, propertyKey, relation);
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
        Metadata.setProperty(target, MetaKey.Relation, propertyKey, relation);
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
        Metadata.setProperty(target, MetaKey.Relation, propertyKey, relation);
    };
}

export function Filterable(options: FilterableOptions) {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        Metadata.setProperty(target, MetaKey.Filterable, propertyKey, options);
    };
}

export function Sortable() {
    return function (target: TargetClass, propertyKey: string) {
        Property()(target, propertyKey);
        Metadata.setProperty(target, MetaKey.Sortable, propertyKey);
    };
}

export function Mutation(type?: ClassType) {
    return function (target: TargetClass, propertyKey: string) {
        const options: ApiOptions = { kind: 'Mutation', type };
        Metadata.setProperty(target, MetaKey.Api, propertyKey, options);
    };
}

export function Query(type?: ClassType) {
    return function (target: TargetClass, propertyKey: string) {
        const options: ApiOptions = { kind: 'Query', type };
        Metadata.setProperty(target, MetaKey.Api, propertyKey, options);
    };
}

export function Resolver(type?: ClassType) {
    return function (target: TargetClass) {
        Metadata.setModelProperty(target, MetaKey.Resolver, type);
    };
}

export function Arg(name: string) {
    return function (target: TargetClass, propertyKey: string, index: number) {
        const { prototype } = target.constructor;
        const type = Reflect.getMetadata(MetaKey.ParamTypes, prototype, propertyKey)[index];
        Metadata.addArgs(target, propertyKey, {
            index,
            name,
            type,
        });
    };
}

export function Ctx() {
    return Arg('ctx');
}
