import * as graphql from 'graphql';
import { ObjectType, InputType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';

import * as util from './util';
import { hasScope } from './property';
import { MetaKey } from './metadata';
import { HydratedProperty, inspect } from './inspect';
import { GraphQLJSONObject } from './js/graphql-type-json';
import { Definition } from './definition';

const cacheKey = Symbol('cached');

class Typer {
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
    @ObjectType(`Paginated${util.plural(definition.name)}`)
    class Placeholder {
      @Field(() => [this.getType(definition, 'output')])
      @Type(() => this.getType(definition, 'output'))
      docs: any[];

      @Field(() => graphql.GraphQLInt)
      totalDocs: number;

      @Field(() => graphql.GraphQLInt)
      page: number;

      @Field(() => graphql.GraphQLInt)
      limit: number;

      @Field(() => graphql.GraphQLInt)
      totalPages: number;

      @Field(() => graphql.GraphQLBoolean)
      hasNextPage: boolean;

      @Field(() => graphql.GraphQLInt)
      nextPage: number;

      @Field(() => graphql.GraphQLBoolean)
      hasPrevPage: boolean;

      @Field(() => graphql.GraphQLInt)
      prevPage: number;

      @Field(() => graphql.GraphQLInt)
      pagingCounter: number;
    }
    return Placeholder;
  }

  private static getBulkCreateOutputType(definition: Definition): any {
    @ObjectType(`BulkCreate${util.plural(definition.name)}Result`)
    class Placeholder {
      // output as json.  search for scalar json
      @Field(() => GraphQLJSONObject)
      input: object;

      @Field(() => this.getType(definition, 'output'), { nullable: true })
      result: boolean;

      @Field(() => graphql.GraphQLBoolean)
      success: boolean;

      @Field(() => graphql.GraphQLString, { nullable: true })
      errorMessage?: string;
    }
    return Placeholder;
  }

  private static getBulkRemoveOutputType(definition: Definition): any {
    @ObjectType(`BulkRemove${util.plural(definition.name)}Result`)
    class Placeholder {
      @Field(() => graphql.GraphQLID)
      id: string;

      @Field(() => graphql.GraphQLBoolean)
      success: boolean;

      @Field(() => graphql.GraphQLString, { nullable: true })
      errorMessage?: string;
    }
    return Placeholder;
  }

  public static getType(
    definition: Definition,
    type: 'create' | 'update' | 'output' | 'paginate' | 'bulkCreate' | 'bulkRemove' | 'filter',
  ) {
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
      {
        type: 'bulkCreate',
        fn: () => Typer.getBulkCreateOutputType(definition),
      },
      {
        type: 'bulkRemove',
        fn: () => Typer.getBulkRemoveOutputType(definition),
      },
      {
        type: 'filter',
        fn: () => FilterTypeWithoutCache(definition),
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
}

export function CreateInputType(definition: Definition) {
  return Typer.getType(definition, 'create');
}

export function UpdateInputType(definition: Definition) {
  return Typer.getType(definition, 'update');
}

export function OutputType(definition: Definition) {
  return Typer.getType(definition, 'output');
}

export function PaginatedOutputType(definition: Definition) {
  return Typer.getType(definition, 'paginate');
}

export function BulkCreateOutputType(definition: Definition) {
  return Typer.getType(definition, 'bulkCreate');
}

export function BulkRemoveOutputType(definition: Definition) {
  return Typer.getType(definition, 'bulkRemove');
}

function getFilterForOneField(definition: Definition, property: HydratedProperty) {
  @InputType(`${definition.name}${util.toPascalCase(property.name)}Filter`)
  class FilterForOneField {}

  const { typeFn, input } = inspect(definition).for(property.name).get(MetaKey.Filterable);
  for (const operator of input.operators) {
    if (['in', 'notIn', 'all'].includes(operator)) {
      Field(() => [typeFn()], { nullable: true })(FilterForOneField.prototype, operator);
      Reflect.defineMetadata('design:type', Array, FilterForOneField.prototype, property.name);
    } else if (operator === 'exists') {
      Field(() => graphql.GraphQLBoolean, { nullable: true })(FilterForOneField.prototype, operator);
      Reflect.defineMetadata('design:type', Boolean, FilterForOneField.prototype, property.name);
    } else {
      Field(typeFn, { nullable: true })(FilterForOneField.prototype, operator);
      const designType = Reflect.getMetadata('design:type', definition.prototype, property.name);
      Reflect.defineMetadata('design:type', designType, FilterForOneField.prototype, property.name);
    }
  }

  return FilterForOneField;
}

function FilterTypeWithoutCache(definition: Definition) {
  const filterableProperties = inspect(definition).getProperties(MetaKey.Filterable);
  if (filterableProperties.length === 0) return null;

  @InputType(`${definition.name}Filter`)
  class FilterPlaceholder {}
  for (const filterableProperty of inspect(definition).getProperties(MetaKey.Filterable)) {
    Reflect.defineMetadata('design:type', Object, FilterPlaceholder.prototype, filterableProperty.name);
    const OneField = getFilterForOneField(definition, filterableProperty);
    Field(() => OneField, { nullable: true })(FilterPlaceholder.prototype, filterableProperty.name);
  }
  return FilterPlaceholder;
}

export function FilterType(definition: Definition) {
  return Typer.getType(definition, 'filter');
}
