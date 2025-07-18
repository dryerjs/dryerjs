import * as util from './util';
import {
  BelongsToConfig,
  EmbeddedConfig,
  HasManyConfig,
  HasOneConfig,
  ReferencesManyConfig,
} from './relations';
import { MetaKey, Metadata } from './metadata';
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

  public getProperties = util.memoize(this.getPropertiesUncached.bind(this));

  public get embeddedProperties(): HydratedProperty[] {
    return this.getProperties(MetaKey.EmbeddedType);
  }

  public get referencesManyProperties(): HydratedProperty[] {
    return this.getProperties(MetaKey.ReferencesManyType);
  }

  public get belongsToProperties(): HydratedProperty[] {
    return this.getProperties(MetaKey.BelongsToType);
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

  public getReferencesMany() {
    const referencesMany = this.get<ReferencesManyConfig>(MetaKey.ReferencesManyType);

    /* istanbul ignore if */
    if (util.isNil(referencesMany)) {
      throw new Error(`Property ${this.name} is not an references many property`);
    }

    return referencesMany;
  }

  public getHasOne() {
    const result = this.get<HasOneConfig>(MetaKey.HasOneType);

    /* istanbul ignore if */
    if (util.isNil(result)) {
      throw new Error(`Property ${this.name} is not an has one property`);
    }

    return result;
  }

  public getEmbedded() {
    const result = this.get<EmbeddedConfig>(MetaKey.EmbeddedType);

    /* istanbul ignore if */
    if (util.isNil(result)) {
      throw new Error(`Property ${this.name} is not an embedded property`);
    }

    return result;
  }

  public getBelongsTo() {
    const result = this.get<BelongsToConfig>(MetaKey.BelongsToType);

    /* istanbul ignore if */
    if (util.isNil(result)) {
      throw new Error(`Property ${this.name} is not an has one property`);
    }

    return result;
  }

  public getHasMany() {
    const result = this.get<HasManyConfig>(MetaKey.HasManyType);

    /* istanbul ignore if */
    if (util.isNil(result)) {
      throw new Error(`Property ${this.name} is not an has many property`);
    }

    return result;
  }
}
