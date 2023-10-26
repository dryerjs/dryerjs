import { ObjectType, InputType } from '@nestjs/graphql';
import { Definition } from './shared';
import { hasScope } from './property';
import { MetaKey, Metadata } from './metadata';

function getCreateInputType(definition: Definition) {
  @InputType(`Create${definition.name}Input`)
  class AbstractCreateInput {}
  for (const property of Object.keys(Metadata.getPropertiesByModel(definition, MetaKey.Thunk))) {
    if (property === 'id') continue;
    const designType = Reflect.getMetadata('design:type', definition.prototype, property);
    Reflect.defineMetadata('design:type', designType, AbstractCreateInput.prototype, property);
    for (const { fn, options } of Metadata.getMetaValue(definition.prototype, MetaKey.Thunk, property)) {
      if (hasScope(options, 'create')) {
        fn(AbstractCreateInput.prototype, property as string);
      }
    }
  }
  return AbstractCreateInput;
}

function getUpdateInputType(definition: Definition) {
  @InputType(`Update${definition.name}Input`)
  class AbstractUpdateInput {}
  for (const property of Object.keys(Metadata.getPropertiesByModel(definition, MetaKey.Thunk))) {
    const designType = Reflect.getMetadata('design:type', definition.prototype, property);
    Reflect.defineMetadata('design:type', designType, AbstractUpdateInput.prototype, property);
    for (const { fn, options } of Metadata.getMetaValue(definition.prototype, MetaKey.Thunk, property)) {
      if (hasScope(options, 'update')) {
        fn(AbstractUpdateInput.prototype, property as string);
      }
    }
  }
  return AbstractUpdateInput;
}

function getObjectType(definition: Definition) {
  @ObjectType(definition.name)
  class AbstractOutput {}
  for (const property of Object.keys(Metadata.getPropertiesByModel(definition, MetaKey.Thunk))) {
    const designType = Reflect.getMetadata('design:type', definition.prototype, property);
    Reflect.defineMetadata('design:type', designType, AbstractOutput.prototype, property);
    for (const { fn, options } of Metadata.getMetaValue(definition.prototype, MetaKey.Thunk, property)) {
      if (hasScope(options, 'output')) {
        fn(AbstractOutput.prototype, property as string);
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
