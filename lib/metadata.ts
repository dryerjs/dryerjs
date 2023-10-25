import * as util from './util';

type TargetClass = any;
type MetaValue = any;

const METADATA = Symbol('metadata');
const MODEL_KEY = Symbol('model_key');

export enum MetaKey {
  DesignType = 'design:type',
  ParamTypes = 'design:paramtypes',
  ReturnType = 'design:returntype',
  ExcludeOnDatabase = 'ExcludeOnDatabase',
  ExcludeOnCreate = 'ExcludeOnCreate',
  EmbeddedType = 'EmbeddedType',
  ReferencesManyType = 'ReferencesManyType',
  Thunk = 'Thunk',
  UseProperty = 'UseProperty',
}

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

  private static getConstructor(target: TargetClass) {
    return typeof target === 'function' ? target : target.constructor;
  }

  public static getMetaValue(target: TargetClass, metaKey: MetaKey, property: string | symbol): MetaValue {
    return this.getConstructor(target)[METADATA]?.[property]?.[metaKey];
  }

  public static setProperty(
    target: TargetClass,
    metaKey: MetaKey,
    property: string | symbol,
    value: MetaValue = true,
  ): void {
    const constructor = this.getConstructor(target);
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
    to[METADATA][property] = { ...from[METADATA]?.[property] };
  }

  public static getModelMetaValue(target: TargetClass, metaKey: MetaKey): MetaValue {
    return this.getMetaValue(target, metaKey, MODEL_KEY);
  }

  public static setModelProperty(target: TargetClass, metaKey: MetaKey, value: MetaValue): void {
    this.setProperty(target, metaKey, MODEL_KEY, value);
  }
}
