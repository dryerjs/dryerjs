import { Definition } from '../definition';
import { getBaseType } from './base';
import { cacheType } from './cache-type';

export function UpdateInputType(definition: Definition) {
  return cacheType(
    () => {
      return getBaseType({
        definition,
        name: `Update${definition.name}Input`,
        scope: 'update',
      });
    },
    definition,
    'UpdateInputType',
  );
}
