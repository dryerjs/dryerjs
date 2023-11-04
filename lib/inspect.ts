import * as util from './util';
import { EmbeddedConfig, HasManyConfig, HasOneConfig, ReferencesManyConfig } from './property';
import { MetaKey, Metadata } from './metadata';
import { ApiType } from './shared';
import { Definition } from './definition';

class InspectedDefinition {
  constructor(private definition: Definition) {}

  private getPropertiesUncached(metaKey: MetaKey = MetaKey.Thunk): HydratedProperty[] {
    const result: HydratedProperty[] = [];
    for (const propertyName in Metadata.getPropertiesByModel(this.definition, metaKey)) {
      const designType = Reflect.getMetadata(MetaKey.DesignType, this.definition.prototype, propertyName);
      const property = new HydratedProperty(this.definition, propertyName, designType);
      result.push(property);
    }
    return result;
  }

  public getProperties = util.memoize(this.getPropertiesUncached);

  public get embeddedProperties(): HydratedProperty[] {
    return this.getProperties(MetaKey.EmbeddedType);
  }

  public get referencesManyProperties(): HydratedProperty[] {
    return this.getProperties(MetaKey.ReferencesManyType);
  }

  public get hasOneProperties(): HydratedProperty[] {
    return this.getProperties(MetaKey.HasOneType);
  }
  public get hasManyProperties(): HydratedProperty[] {
    return this.getProperties(MetaKey.HasManyType);
  }

  public for(propertyName: string | symbol): HydratedProperty {
    const designType = Reflect.getMetadata(MetaKey.DesignType, this.definition.prototype, propertyName);
    return new HydratedProperty(this.definition, propertyName as string, designType);
  }

  public isApiAllowed(api: ApiType): boolean {
    const { allowedApis } = Metadata.for(this.definition).get(MetaKey.Definition);
    const normalizedAllowedApis = util.isArray(allowedApis) ? allowedApis : [allowedApis];
    for (const allowedApi of normalizedAllowedApis) {
      if (allowedApi === '*') return true;
      if (allowedApi === 'essentials') {
        return ['create', 'update', 'getOne', 'remove', 'paginate'].includes(api);
      }
      if (allowedApi === api) return true;
    }
    return false;
  }
}

export const inspect = util.memoize((definition: Definition) => new InspectedDefinition(definition));

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

  public getHasOne() {
    const hasOne = this.get<HasOneConfig>(MetaKey.HasOneType);

    /* istanbul ignore if */
    if (util.isNil(hasOne)) {
      throw new Error(`Property ${this.name} is not an has one property`);
    }

    return hasOne;
  }

  public getHasMany() {
    const hasMany = this.get<HasManyConfig>(MetaKey.HasManyType);

    /* istanbul ignore if */
    if (util.isNil(hasMany)) {
      throw new Error(`Property ${this.name} is not an has many property`);
    }

    return hasMany;
  }
}
