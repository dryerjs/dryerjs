import { MetaKey, Metadata } from '../metadata';

export type BelongsToConfig = {
  typeFunction: () => any;
  options: {
    from: string;
    noPopulation?: boolean;
    strict?: boolean;
  };
};
export function BelongsTo(
  typeFunction: BelongsToConfig['typeFunction'],
  options: BelongsToConfig['options'],
) {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target)
      .with(propertyKey)
      .set<BelongsToConfig>(MetaKey.BelongsToType, { typeFunction, options });
  };
}
