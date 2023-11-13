import * as util from './util';

type TargetClass = any;
type MetaValue = any;

const METADATA = Symbol('metadata');
const DEFINITION = Symbol('definition');

export enum MetaKey {
  DesignType = 'design:type',
  ParamTypes = 'design:paramtypes',
  ReturnType = 'design:returntype',
  EmbeddedType = 'EmbeddedType',
  ReferencesManyType = 'ReferencesManyType',
  HasOneType = 'HasOneType',
  HasManyType = 'HasManyType',
  BelongsToType = 'BelongsToType',
  Thunk = 'Thunk',
  Definition = 'Definition',
  Hook = 'Hook',
  Filterable = 'Filterable',
  Sortable = 'Sortable',
  Property = 'Property',
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

  private static setMetaValue(
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

  private static getMetaValue(target: TargetClass, metaKey: MetaKey, property: string | symbol): MetaValue {
    return this.getConstructor(target)[METADATA]?.[property]?.[metaKey];
  }

  public static for(target: TargetClass) {
    return {
      set(key: MetaKey, value: MetaValue) {
        Metadata.setMetaValue(target, key, DEFINITION, value);
      },
      get<T = any>(key: MetaKey): T {
        return Metadata.getMetaValue(target, key, DEFINITION);
      },
      with(property: string | symbol) {
        return {
          set<T = any>(key: MetaKey, value: T) {
            Metadata.setMetaValue(target, key, property, value);
          },
          get<T = any>(key: MetaKey): T {
            return Metadata.getMetaValue(target, key, property);
          },
        };
      },
    };
  }
}
