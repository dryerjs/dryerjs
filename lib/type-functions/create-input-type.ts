import { Definition } from '../definition';
import * as util from '../util';
import { getBaseType } from './base';

function getType(definition: Definition) {
  return getBaseType({
    definition,
    name: `Create${definition.name}Input`,
    scope: 'create',
  });
}

export const CreateInputType = util.memoize(getType);
