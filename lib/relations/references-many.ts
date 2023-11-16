import { Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';

import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';
import { CreateInputType } from '../type-functions';

export type ReferencesManyConfig = {
  typeFunction: () => any;
  options: {
    from: string;
    allowCreateWithin?: boolean;
    noPopulation?: boolean;
  };
};

export function ReferencesMany(
  typeFunction: ReferencesManyConfig['typeFunction'],
  options: ReferencesManyConfig['options'],
) {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target)
      .with(propertyKey)
      .set<ReferencesManyConfig>(MetaKey.ReferencesManyType, { typeFunction, options });

    if (options.allowCreateWithin) {
      Thunk(
        Field(() => [CreateInputType(typeFunction())], { nullable: true }),
        { scopes: 'create' },
      )(target, propertyKey);

      Thunk(
        Type(() => CreateInputType(typeFunction())),
        { scopes: 'create' },
      )(target, propertyKey);
    }
  };
}
