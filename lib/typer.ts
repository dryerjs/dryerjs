import { ObjectType, Field, InputType } from '@nestjs/graphql';

import { Definition } from './shared';
import { defaultCached, objectCached, thunkCached } from './property';

function getInputType(definition: Definition) {
  @InputType(`${definition.name}Input`)
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

    for (const thunkFunction of thunkCached[definition.name]?.[property] ||
      []) {
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

const builtInput = Symbol('builtInput');
const builtOutput = Symbol('builtOutput');
export class Typer {
  public static getInputType(definition: Definition) {
    if (definition[builtInput]) return definition[builtInput];
    const result = getInputType(definition);
    definition[builtInput] = result;
    return definition[builtInput];
  }

  public static getObjectType(definition: Definition) {
    if (definition[builtOutput]) return definition[builtOutput];
    const result = getObjectType(definition);
    definition[builtOutput] = result;
    return definition[builtOutput];
  }
}
