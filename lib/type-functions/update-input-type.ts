import * as util from '../util';
import { Definition } from '../definition';
import { getBaseType } from './base';

function getType(definition: Definition) {
  return getBaseType({
    definition,
    name: `Update${definition.name}Input`,
    scope: 'update',
  });
}

export const UpdateInputType = util.memoize(getType);
