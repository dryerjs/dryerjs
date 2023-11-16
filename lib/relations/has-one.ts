import { Field } from '@nestjs/graphql';
import { CreateInputTypeWithin, OutputType } from '../type-functions';

import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';

export type HasOneConfig = {
  typeFunction: () => any;
  options: {
    to: string;
    allowCreateWithin?: boolean;
    noPopulation?: boolean;
  };
};
export function HasOne(typeFunction: HasOneConfig['typeFunction'], options: HasOneConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set<HasOneConfig>(MetaKey.HasOneType, { typeFunction, options });
    if (options.allowCreateWithin) {
      Thunk(
        Field(() => CreateInputTypeWithin(typeFunction(), target.constructor, options.to), {
          nullable: true,
        }),
        { scopes: 'create' },
      )(target, propertyKey);
    }

    if (options.noPopulation !== true) {
      Thunk(
        Field(() => OutputType(typeFunction()), { nullable: true }),
        { scopes: 'output' },
      )(target, propertyKey);
    }
  };
}
