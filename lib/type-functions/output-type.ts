import { Definition } from '../definition';
import * as util from '../util';
import { getBaseType } from './base';

export function getType(definition: Definition) {
  return getBaseType({
    definition,
    name: definition.name,
    scope: 'output',
  });
}

export const OutputType = util.memoize(getType);
