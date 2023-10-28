import * as util from './util';
import { EmbeddedConfig, ReferencesManyConfig } from './property';
import { MetaKey, Metadata } from './metadata';
import { ApiType } from './shared';
import { Definition } from './definition';

const INSPECTED = Symbol('inspected');
const CACHED_PROPERTIES = Symbol('cached_properties');

function inspectWithoutCache(definition: Definition) {
  return {
    [CACHED_PROPERTIES]: {},
    getProperties(metaKey: MetaKey = MetaKey.Thunk): HydratedProperty[] {
      if (this[CACHED_PROPERTIES][metaKey]) return this[CACHED_PROPERTIES][metaKey];
      const result: HydratedProperty[] = [];
      for (const propertyName in Metadata.getPropertiesByModel(definition, metaKey)) {
        const designType = Reflect.getMetadata(MetaKey.DesignType, definition.prototype, propertyName);
        const property = new HydratedProperty(definition, propertyName, designType);
        result.push(property);
      }
      this[CACHED_PROPERTIES][metaKey] = result;
      return result;
    },
    get embeddedProperties(): HydratedProperty[] {
      return this.getProperties(MetaKey.EmbeddedType);
    },
    get referencesManyProperties(): HydratedProperty[] {
      return this.getProperties(MetaKey.ReferencesManyType);
    },
    for(propertyName: string | symbol): HydratedProperty {
      const designType = Reflect.getMetadata(MetaKey.DesignType, definition.prototype, propertyName);
      return new HydratedProperty(definition, propertyName as string, designType);
    },
    isApiAllowed(api: ApiType): boolean {
      const { allowedApis } = Metadata.for(definition).get(MetaKey.Definition);
      const normalizedAllowedApis = util.isArray(allowedApis) ? allowedApis : [allowedApis];
      for (const allowedApi of normalizedAllowedApis) {
        if (allowedApi === '*') return true;
        if (allowedApi === 'essentials') {
          return ['create', 'update', 'getOne', 'remove', 'paginate'].includes(api);
        }
        if (allowedApi === api) return true;
      }
      return false;
    },
  };
}

export function inspect(definition: any): ReturnType<typeof inspectWithoutCache> {
  if (definition[INSPECTED]) return definition[INSPECTED];
  const result = inspectWithoutCache(definition);
  definition[INSPECTED] = result;
  return definition[INSPECTED];
}

type ClassType = any;

export class HydratedProperty {
  constructor(
    public definition: any,
    public name: string,
    public designType: ClassType,
  ) {}

  public get<T = any>(key: MetaKey) {
    return Metadata.for(this.definition).with(this.name).get<T>(key);
  }

  public getEmbeddedDefinition() {
    const config = this.get<EmbeddedConfig>(MetaKey.EmbeddedType);

    /* istanbul ignore if */
    if (util.isNil(config)) {
      throw new Error(`Property ${this.name} is not an embedded property`);
    }

    return config.typeFunction();
  }

  public getReferencesMany() {
    const referencesMany = this.get<ReferencesManyConfig>(MetaKey.ReferencesManyType);

    /* istanbul ignore if */
    if (util.isNil(referencesMany)) {
      throw new Error(`Property ${this.name} is not an references many property`);
    }

    return referencesMany;
  }
}
