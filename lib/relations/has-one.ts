import { Field } from '@nestjs/graphql';
import { CreateInputTypeWithin } from '../type-functions';

import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';

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
      Thunk(
        Field(() => CreateInputTypeWithin(typeFunction(), target.constructor, options.to), {
          nullable: true,
        }),
        { scopes: 'create' },
      )(target, propertyKey);
    }
  };
}
