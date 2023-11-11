import { Definition } from '../definition';
import * as util from '../util';
import { getBaseType } from './base';

function getType(definition: Definition, parentDefinition: Definition, skipField: string) {
  return getBaseType({
    definition,
    name: `Create${definition.name}Within${parentDefinition.name}Input`,
    scope: 'create',
    skipFields: [skipField],
  });
}

export const CreateInputTypeWithin = util.memoize(getType);
