import { ObjectType, Field, InputType } from '@nestjs/graphql';

import * as util from './util';
import { Definition } from './shared';
import { defaultCached, objectCached, thunkCached } from './property';

function getCreateInputType(definition: Definition) {
  @InputType(`Create${definition.name}Input`)
  class AbstractInput {}
  for (const property of Object.keys(defaultCached[definition.name])) {
    if (property === 'id') continue;
    const designType = Reflect.getMetadata(
      'design:type',
      definition.prototype,
      property,
    );

    Reflect.defineMetadata(
      'design:type',
      designType,
      AbstractInput.prototype,
      property,
    );

    const { returnTypeFunction, options } =
      defaultCached[definition.name][property];

    Field(returnTypeFunction, options)(
      AbstractInput.prototype,
      property as string,
    );

    for (const thunkFunction of util.defaultTo(
      thunkCached[definition.name]?.[property],
      [],
    )) {
      thunkFunction(AbstractInput.prototype, property as string);
    }
  }
  return AbstractInput;
}

function getUpdateInputType(definition: Definition) {
  @InputType(`Update${definition.name}Input`)
  class AbstractInput {}
  for (const property of Object.keys(defaultCached[definition.name])) {
    const designType = Reflect.getMetadata(
      'design:type',
      definition.prototype,
      property,
    );

    Reflect.defineMetadata(
      'design:type',
      designType,
      AbstractInput.prototype,
      property,
    );

    const { returnTypeFunction, options } =
      defaultCached[definition.name][property];

    Field(returnTypeFunction, options)(
      AbstractInput.prototype,
      property as string,
    );

    for (const thunkFunction of util.defaultTo(
      thunkCached[definition.name]?.[property],
      [],
    )) {
      thunkFunction(AbstractInput.prototype, property as string);
    }
  }
  return AbstractInput;
}

function getObjectType(definition: Definition) {
  @ObjectType(definition.name, { isAbstract: true })
  class AbstractOutput {}
  for (const property of Object.keys(defaultCached[definition.name])) {
    const designType = Reflect.getMetadata(
      'design:type',
      definition.prototype,
      property,
    );
    Reflect.defineMetadata(
      'design:type',
      designType,
      AbstractOutput.prototype,
      property,
    );
    const { returnTypeFunction, options } =
      objectCached?.[definition.name]?.[property] ||
      defaultCached[definition.name][property];

    Field(returnTypeFunction, options)(
      AbstractOutput.prototype,
      property as string,
    );
  }
  return AbstractOutput;
}

const builtCreateInput = Symbol('builtCreateInput');
const builtUpdateInput = Symbol('builtUpdateInput');
const builtOutput = Symbol('builtOutput');
export class Typer {
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
