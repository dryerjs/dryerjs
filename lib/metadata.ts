import * as util from './util';

type TargetClass = any;
type MetaValue = any;

const METADATA = Symbol('metadata');

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

  public static setMetaValue(
    target: TargetClass,
    metaKey: MetaKey,
    property: string | symbol,
    value: MetaValue,
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
}
