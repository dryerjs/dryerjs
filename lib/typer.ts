import * as graphql from 'graphql';
import { ObjectType, InputType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';

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
    return Placeholder;
  }

  private static getPaginatedOutputType(definition: Definition): any {
    const cached = definition[cacheKey]?.['paginated'];
    if (cached) return cached;
    @ObjectType(`Paginated${util.plural(definition.name)}`)
    class Placeholder {
      @Field(() => [this.getType(definition, 'output')])
      @Type(() => this.getType(definition, 'output'))
      docs: any[];

      @Field(() => graphql.GraphQLInt)
      totalDocs: number;

      @Field(() => graphql.GraphQLInt)
      page: number;
    }
    definition[cacheKey]['paginated'] = Placeholder;
    return definition[cacheKey]['paginated'];
  }

  private static getType(definition: Definition, type: 'create' | 'update' | 'output' | 'paginate') {
    const cached = definition[cacheKey]?.[type];
    if (cached) return cached;
    const typeConfigs = [
      {
        type: 'create',
        fn: () =>
          Typer.getBaseType({
            definition,
            name: `Create${definition.name}Input`,
            scope: 'create',
          }),
      },
      {
        type: 'update',
        fn: () =>
          Typer.getBaseType({
            definition,
            name: `Update${definition.name}Input`,
            scope: 'update',
          }),
      },
      {
        type: 'output',
        fn: () =>
          Typer.getBaseType({
            definition,
            name: definition.name,
            scope: 'output',
          }),
      },
      {
        type: 'paginate',
        fn: () => Typer.getPaginatedOutputType(definition),
      },
    ];

    const typeConfig = typeConfigs.find((config) => config.type === type);
    const typeInstance = typeConfig!.fn();
    definition[cacheKey] = {
      ...util.defaultTo(definition[cacheKey], {}),
      [type]: typeInstance,
    };
    return typeInstance;
  }

  public static for(definition: Definition) {
    return {
      get: (type: 'create' | 'update' | 'output' | 'paginate') => Typer.getType(definition, type),
      get output() {
        return Typer.getType(definition, 'output');
      },
      get create() {
        return Typer.getType(definition, 'create');
      },
      get update() {
        return Typer.getType(definition, 'update');
      },
      get paginate() {
        return Typer.getType(definition, 'paginate');
      },
    };
  }
}
