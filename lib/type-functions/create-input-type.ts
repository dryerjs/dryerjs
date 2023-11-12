import * as util from '../util';
import { BaseClassType, getBaseType } from './base';

function getType<T extends object>(definition: BaseClassType<T>): BaseClassType<T> {
  return getBaseType({
    definition,
    name: `Create${definition.name}Input`,
    scope: 'create',
  });
}

export const CreateInputType = util.memoize(getType);
