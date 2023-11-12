import * as util from '../util';
import { BaseClassType, getBaseType } from './base';

export function getType<T extends object>(definition: BaseClassType<T>): BaseClassType<T> {
  return getBaseType({
    definition,
    name: definition.name,
    scope: 'output',
  });
}

export const OutputType = util.memoize(getType);
