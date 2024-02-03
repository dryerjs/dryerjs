import * as util from '../util';
import { BaseClassType, getBaseType } from './base';

function getType<T extends object>(definition: BaseClassType<T>): BaseClassType<T> {
  const result = getBaseType({
    definition,
    name: `UpdateEmbedded${definition.name}Input`,
    scope: 'update',
    isEmbeddedUpdateInput: true,
  });
  return result;
}

export const UpdateEmbeddedInputType = util.memoize(getType);
