import { ObjectType, InputType } from '@nestjs/graphql';
import * as util from './util';
import { Definition } from './shared';
import { hasScope } from './property';
import { MetaKey } from './metadata';
import { inspect } from './inspect';

const cacheKey = Symbol('cached');

export class Typer {
  private static getBaseType(input: {
    definition: Definition;
    name: string;
    scope: 'create' | 'update' | 'output';
  }) {
    const cached = input.definition[cacheKey]?.[input.scope];
    if (cached) return cached;

    const decoratorFn = input.scope === 'output' ? ObjectType : InputType;
    @decoratorFn(input.name)
    class Placeholder {}

    for (const property of inspect(input.definition).getProperties()) {
      const designType = Reflect.getMetadata('design:type', input.definition.prototype, property.name);
      Reflect.defineMetadata('design:type', designType, Placeholder.prototype, property.name);
      for (const { fn, options } of inspect(input.definition).for(property.name).get(MetaKey.Thunk)) {
        if (hasScope(options, input.scope)) {
          fn(Placeholder.prototype, property.name);
        }
      }
    }
    input.definition[cacheKey] = {
      ...util.defaultTo(input.definition[cacheKey], {}),
      [input.scope]: Placeholder,
    };

    return input.definition[cacheKey][input.scope];
  }

  public static getCreateInputType(definition: Definition) {
    return this.getBaseType({
      definition,
      name: `Create${definition.name}Input`,
      scope: 'create',
    });
  }

  public static getUpdateInputType(definition: Definition) {
    return this.getBaseType({
      definition,
      name: `Update${definition.name}Input`,
      scope: 'update',
    });
  }

  public static getObjectType(definition: Definition) {
    return this.getBaseType({
      definition,
      name: definition.name,
      scope: 'output',
    });
  }
}
