import * as util from '../util';
import { Definition } from '../definition';

const CACHED_TYPE = Symbol('CACHED_TYPE');

export function cacheType(typeFn: () => any, definition: Definition, cacheKey: string) {
  if (definition[CACHED_TYPE] && !util.isUndefined(definition[CACHED_TYPE][cacheKey])) {
    return definition[CACHED_TYPE][cacheKey];
  }

  if (!definition[CACHED_TYPE]) {
    definition[CACHED_TYPE] = {};
  }
  definition[CACHED_TYPE][cacheKey] = typeFn();
  return definition[CACHED_TYPE][cacheKey];
}
