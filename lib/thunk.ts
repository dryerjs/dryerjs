import * as util from './util';
import { MetaKey, Metadata } from './metadata';

export type ThunkScope = 'all' | 'create' | 'update' | 'input' | 'output';

export type ThunkOptions = {
  scopes: Array<ThunkScope> | ThunkScope;
  fn?: Function;
};

export function Thunk(
  fn: any,
  options: ThunkOptions = { scopes: 'all' },
): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const property = Metadata.for(target).with(propertyKey);
    const prevThunks = property.get(MetaKey.Thunk);
    const newThunks = util.defaultTo(prevThunks, []).concat({ fn, options });
    property.set(MetaKey.Thunk, newThunks);
  };
}
