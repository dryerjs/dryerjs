import 'reflect-metadata';
import * as util from './util';

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
    Enum = 'Enum',
    Embedded = 'Embedded',
}

type TargetClass = any;
type AnyEnum = { [key: string]: any };
type MetaValue = any;

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

export function Property(options: { enum?: AnyEnum } = {}) {
    return function (target: TargetClass, propertyKey: string) {
        Metadata.addProperty(target.constructor.name, MetaKey.DesignType, propertyKey);
        if (util.isNotNullObject(options.enum)) {
            if (Object.keys(options.enum).length !== 1) {
                const message = `Enum should be defined as an object. Example: @Property({ enum: { UserStatus })`;
                throw new Error(message);
            }
            Metadata.addProperty(target.constructor.name, MetaKey.Enum, propertyKey, options.enum);
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

export class TraversedProperty {
    constructor(
        private modelDefinition: any,
        public name: string,
        public typeInClass: any,
    ) {}

    public getMetaValue(key: MetaKey) {
        return Metadata.getMetaValue(this.modelDefinition.name, key, this.name);
    }

    public getEmbeddedModelDefinition() {
        const result = this.getMetaValue(MetaKey.Embedded);
        if (util.isUndefined(result)) {
            throw new Error(`Property ${this.name} is not an embedded property`);
        }
        return result;
    }
}

export function inspect(modelDefinition: any) {
    const INSTANCE_KEY = '__inspectable_instance';
    modelDefinition[INSTANCE_KEY] = modelDefinition[INSTANCE_KEY] || new modelDefinition();
    const instance = modelDefinition[INSTANCE_KEY];

    return {
        getProperties(metaKey: MetaKey = MetaKey.DesignType) {
            const result: TraversedProperty[] = [];
            for (const propertyName in Metadata.getPropertiesByModel(modelDefinition.name, metaKey)) {
                const typeInClass = Reflect.getMetadata(MetaKey.DesignType, instance, propertyName);
                const property = new TraversedProperty(modelDefinition, propertyName, typeInClass);
                result.push(property);
            }
            return result;
        },
        getEmbeddedProperties(): TraversedProperty[] {
            return this.getProperties(MetaKey.Embedded);
        },
    };
}
