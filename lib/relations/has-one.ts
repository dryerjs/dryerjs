import { Field } from '@nestjs/graphql';
import { CreateInputTypeWithin } from '../type-functions';

import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';
import { Type } from 'class-transformer';

export type HasOneConfig = {
  typeFunction: () => any;
  options: {
    to: string;
    allowCreateWithin?: boolean;
    noPopulation?: boolean;
    skipRelationCheckOnRemove?: boolean;
  };
};
export function HasOne(typeFunction: HasOneConfig['typeFunction'], options: HasOneConfig['options']) {
  return (target: any, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set<HasOneConfig>(MetaKey.HasOneType, { typeFunction, options });
    if (options.allowCreateWithin) {
      const type = CreateInputTypeWithin(typeFunction(), target.constructor, options.to);
      Thunk(
        Field(() => type, {
          nullable: true,
        }),
        { scopes: 'create' },
      )(target, propertyKey);
      Thunk(
        Type(() => type),
        { scopes: 'create' },
      )(target, propertyKey);
    }
  };
}
