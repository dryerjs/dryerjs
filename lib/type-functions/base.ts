import { ObjectType, InputType } from '@nestjs/graphql';

import { hasScope } from '../property';
import { MetaKey } from '../metadata';
import { inspect } from '../inspect';
import { Definition } from '../definition';

export function getBaseType(input: {
  definition: Definition;
  name: string;
  scope: 'create' | 'update' | 'output';
}) {
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
  return Placeholder as any;
}
