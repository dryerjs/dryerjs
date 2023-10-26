import { ObjectType, InputType } from '@nestjs/graphql';
import { Definition } from './shared';
import { hasScope } from './property';
import { MetaKey } from './metadata';
import { inspect } from './inspect';

function getCreateInputType(definition: Definition) {
  @InputType(`Create${definition.name}Input`)
  class AbstractCreateInput {}
  for (const property of inspect(definition).getProperties()) {
    if (property.name === 'id') continue;
    const designType = Reflect.getMetadata('design:type', definition.prototype, property.name);
    Reflect.defineMetadata('design:type', designType, AbstractCreateInput.prototype, property.name);
    for (const { fn, options } of inspect(definition).for(property.name).get(MetaKey.Thunk)) {
      if (hasScope(options, 'create')) {
        fn(AbstractCreateInput.prototype, property.name);
      }
    }
  }
  return AbstractCreateInput;
}

function getUpdateInputType(definition: Definition) {
  @InputType(`Update${definition.name}Input`)
  class AbstractUpdateInput {}
  for (const property of inspect(definition).getProperties()) {
    const designType = Reflect.getMetadata('design:type', definition.prototype, property.name);
    Reflect.defineMetadata('design:type', designType, AbstractUpdateInput.prototype, property.name);
    for (const { fn, options } of inspect(definition).for(property.name).get(MetaKey.Thunk)) {
      if (hasScope(options, 'update')) {
        fn(AbstractUpdateInput.prototype, property.name);
      }
    }
  }
  return AbstractUpdateInput;
}

function getObjectType(definition: Definition) {
  @ObjectType(definition.name)
  class AbstractOutput {}
  for (const property of inspect(definition).getProperties()) {
    const designType = Reflect.getMetadata('design:type', definition.prototype, property.name);
    Reflect.defineMetadata('design:type', designType, AbstractOutput.prototype, property.name);
    for (const { fn, options } of inspect(definition).for(property.name).get(MetaKey.Thunk)) {
      if (hasScope(options, 'output')) {
        fn(AbstractOutput.prototype, property.name);
      }
    }
  }
  return AbstractOutput;
}

const builtCreateInput = Symbol('builtCreateInput');
const builtUpdateInput = Symbol('builtUpdateInput');
const builtOutput = Symbol('builtOutput');

export class Typer {
  // private static getBaseType(input: {
  //   definition: Definition;
  //   name: string;
  //   scope: 'create' | 'update' | 'output';
  // }) {
  //   class Abstract
  // }

  public static getCreateInputType(definition: Definition) {
    if (definition[builtCreateInput]) return definition[builtCreateInput];
    const result = getCreateInputType(definition);
    definition[builtCreateInput] = result;
    return definition[builtCreateInput];
  }

  public static getUpdateInputType(definition: Definition) {
    if (definition[builtUpdateInput]) return definition[builtUpdateInput];
    const result = getUpdateInputType(definition);
    definition[builtUpdateInput] = result;
    return definition[builtUpdateInput];
  }

  public static getObjectType(definition: Definition) {
    if (definition[builtOutput]) return definition[builtOutput];
    const result = getObjectType(definition);
    definition[builtOutput] = result;
    return definition[builtOutput];
  }
}
