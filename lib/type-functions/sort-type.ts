import { InputType, Field, registerEnumType } from '@nestjs/graphql';

import * as util from '../util';
import { MetaKey } from '../metadata';
import { inspect } from '../inspect';
import { Definition } from '../definition';

export enum SortDirection {
  ASC = 1,
  DESC = -1,
}

registerEnumType(SortDirection, {
  name: 'SortDirection',
});

function getType(definition: Definition) {
  const filterableProperties = inspect(definition).getProperties(MetaKey.Sortable);
  if (filterableProperties.length === 0) return null;

  @InputType(`${definition.name}Sort`)
  class SortPlaceholder {}
  for (const filterableProperty of inspect(definition).getProperties(MetaKey.Sortable)) {
    Reflect.defineMetadata('design:type', Object, SortPlaceholder.prototype, filterableProperty.name);
    Field(() => SortDirection, { nullable: true })(SortPlaceholder.prototype, filterableProperty.name);
  }
  return SortPlaceholder as any;
}

export const SortType = util.memoize(getType);
