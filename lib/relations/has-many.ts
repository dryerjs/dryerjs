import { Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
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
  return (target: any, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set<HasManyConfig>(MetaKey.HasManyType, { typeFunction, options });
    if (options.allowCreateWithin) {
      const typeFn = () => CreateInputTypeWithin(typeFunction(), target.constructor, options.to);
      Thunk(
        Field(() => [typeFn()], {
          nullable: true,
        }),
        { scopes: 'create' },
      )(target, propertyKey);
      Thunk(Type(typeFn), { scopes: 'create' })(target, propertyKey);
    }
  };
}
