import { Definition } from '../definition';
import { getBaseType } from './base';
import { cacheType } from './cache-type';

export function CreateInputType(definition: Definition) {
  return cacheType(
    () => {
      return getBaseType({
        definition,
        name: `Create${definition.name}Input`,
        scope: 'create',
      });
    },
    definition,
    'CreateInputType',
  );
}
