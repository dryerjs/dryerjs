import { Field } from '@nestjs/graphql';
import { CreateInputTypeWithin } from '../type-functions';

import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';

export type HasManyConfig = {
  typeFunction: () => any;
  options: {
    to: string;
    allowCreateWithin?: boolean;
    allowPaginate?: boolean;
    allowFindAll?: boolean;
    skipRelationCheckOnRemove?: boolean;
  };
};

export function HasMany(typeFunction: HasManyConfig['typeFunction'], options: HasManyConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set<HasManyConfig>(MetaKey.HasManyType, { typeFunction, options });
    if (options.allowCreateWithin) {
      Thunk(
        Field(() => [CreateInputTypeWithin(typeFunction(), target.constructor, options.to)], {
          nullable: true,
        }),
        { scopes: 'create' },
      )(target, propertyKey);
    }
  };
}
