import * as graphql from 'graphql';
import { InputType, Field } from '@nestjs/graphql';

import * as util from '../util';
import { MetaKey, Metadata } from '../metadata';
import { HydratedProperty, inspect } from '../inspect';
import { Definition, DefinitionOptions } from '../definition';

function getFilterForOneField(definition: Definition, property: HydratedProperty) {
  @InputType(`${definition.name}${util.toPascalCase(property.name)}FilterField`)
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

function getType(definition: Definition) {
  const filterableProperties = inspect(definition).getProperties(MetaKey.Filterable);
  if (filterableProperties.length === 0) return null;

  @InputType(`${definition.name}Filter`)
  class FilterPlaceholder {}
  for (const filterableProperty of inspect(definition).getProperties(MetaKey.Filterable)) {
    Reflect.defineMetadata('design:type', Object, FilterPlaceholder.prototype, filterableProperty.name);
    const OneField = getFilterForOneField(definition, filterableProperty);
    Field(() => OneField, { nullable: true })(FilterPlaceholder.prototype, filterableProperty.name);
  }

  if (Metadata.for(definition).get<DefinitionOptions>(MetaKey.Definition).enableTextSearch) {
    const searchFieldName = 'search';
    Reflect.defineMetadata('design:type', String, FilterPlaceholder.prototype, searchFieldName);
    Field(() => graphql.GraphQLString, { nullable: true })(FilterPlaceholder.prototype, searchFieldName);
  }

  return FilterPlaceholder as any;
}

export const FilterType = util.memoize(getType);
