import * as util from '../util';
import { BaseClassType, getBaseType } from './base';

function getType<T extends object>(definition: BaseClassType<T>): BaseClassType<T> {
  return getBaseType({
    definition,
    name: `Update${definition.name}Input`,
    scope: 'update',
  });
}

export const UpdateInputType = util.memoize(getType);
