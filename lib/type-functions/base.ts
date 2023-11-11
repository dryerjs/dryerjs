import { ObjectType, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import { hasScope } from '../property';
import { MetaKey } from '../metadata';
import { inspect } from '../inspect';
import { Definition } from '../definition';
import { ObjectId } from '../shared';

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
  return Placeholder as any;
}
