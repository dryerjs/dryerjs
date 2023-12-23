import { ObjectType, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import * as util from '../util';
import { MetaKey } from '../metadata';
import { inspect } from '../inspect';
import { Definition } from '../definition';
import { ObjectId } from '../shared';
import { ThunkOptions, ThunkScope } from '../thunk';

type Constructor<T extends object, Arguments extends unknown[] = any[]> = new (...arguments_: Arguments) => T;

export type BaseClassType<T extends object = object, Arguments extends unknown[] = any[]> = Constructor<
  T,
  Arguments
> & {
  prototype: T;
};

export const hasScope = (option: ThunkOptions, checkScope: ThunkScope) => {
  const mapping = {
    all: ['create', 'update', 'output'],
    input: ['create', 'update'],
  };

  const normalizedScopes = util.isArray(option.scopes) ? option.scopes : [option.scopes];

  for (const scope of normalizedScopes) {
    if (mapping[scope as string]?.includes(checkScope)) return true;
    if (scope === checkScope) return true;
  }

  return false;
};

export function getBaseType(input: {
  definition: Definition;
  name: string;
  scope: 'create' | 'update' | 'output';
  skipFields?: string[];
}) {
  const decoratorFn = input.scope === 'output' ? ObjectType : InputType;
  @decoratorFn(input.name)
  class Placeholder {}

  for (const property of inspect(input.definition).getProperties()) {
    if (input.skipFields?.includes(property.name)) {
      continue;
    }
    const designType = Reflect.getMetadata('design:type', input.definition.prototype, property.name);
    if (designType === ObjectId || property.get(MetaKey.Property)?.db?.type?.[0] === ObjectId) {
      Transform(({ obj, key }) => obj[key])(Placeholder.prototype, property.name);
    }
    Reflect.defineMetadata('design:type', designType, Placeholder.prototype, property.name);
    for (const { fn, options } of inspect(input.definition).for(property.name).get(MetaKey.Thunk)) {
      if (hasScope(options, input.scope)) {
        fn(Placeholder.prototype, property.name);
      }
    }
  }
  // prevent class-transformer from transforming _id
  Transform(({ obj, key }) => obj[key])(Placeholder.prototype, '_id');
  return Placeholder as any;
}
