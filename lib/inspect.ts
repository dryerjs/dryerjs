import * as util from './util';
import { MetaKey, Metadata } from './metadata';

const INSPECTED = Symbol('inspected');
const CACHED_PROPERTIES = Symbol('cached_properties');

function inspectWithoutCache(definition: any) {
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

  public get(key: MetaKey) {
    return Metadata.for(this.definition).with(this.name).get(key);
  }

  public set(key: MetaKey, value: any) {
    return Metadata.for(this.definition).with(this.name).set(key, value);
  }

  public isArray() {
    return util.isFunction(this.designType) && this.designType.name === 'Array';
  }

  public isEmbedded() {
    return util.isObject(this.get(MetaKey.EmbeddedType));
  }

  public getEmbeddedDefinition() {
    const fn = this.get(MetaKey.EmbeddedType);

    if (!util.isFunction(fn)) {
      throw new Error(`Property ${this.name} is not an embedded property`);
    }

    return fn();
  }

  public getReferencesMany() {
    const referencesMany = this.get(MetaKey.ReferencesManyType);

    if (util.isNil(referencesMany)) {
      throw new Error(`Property ${this.name} is not an references many property`);
    }

    return referencesMany;
  }
}
