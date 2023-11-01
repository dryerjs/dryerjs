import { Definition } from '../definition';
import { getBaseType } from './base';
import { cacheType } from './cache-type';

export function OutputType(definition: Definition) {
  return cacheType(
    () => {
      return getBaseType({
        definition,
        name: definition.name,
        scope: 'output',
      });
    },
    definition,
    'OutputType',
  );
}
