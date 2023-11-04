import { plural, singular } from './js/pluralize';

export { plural, singular };

export const isNil = (value: any): value is null | undefined => value === null || value === undefined;

export const isNotNil = (value: any) => !isNil(value);

export const isObject = (value: any): value is object => typeof value === 'object';

export const isArray = (value: any) => Array.isArray(value);

export const isNotNullObject = (value: any): value is object => typeof value === 'object' && value !== null;

export const isFunction = (value: any) => typeof value === 'function';

export const isUndefined = (value: any): value is undefined => typeof value === 'undefined';

export const isTruthy = (value: any) => !!value;

export const isString = (value: any): value is string => typeof value === 'string';

export const defaultTo = <T>(value: T | null | undefined, defaultValue: T): T => {
  const shouldUseDefaultValue = isNil(value) || (typeof value === 'number' && isNaN(value));
  return shouldUseDefaultValue ? defaultValue : (value as T);
};

export const deepOmit = (object: any, omitKeys: string[]) => {
  if (typeof object !== 'object' || object === null) {
    return object;
  }

  const result = Array.isArray(object) ? [] : {};

  for (const key in object) {
    if (object.hasOwnProperty(key) && !omitKeys.includes(key)) {
      if (typeof object[key] === 'object' && object[key] !== null) {
        // Recursively omit keys from nested objects
        result[key] = deepOmit(object[key], omitKeys);
      } else {
        result[key] = object[key];
      }
    }
  }

  return result;
};

export const toPascalCase = (str: string) => str.replace(str[0], str[0].toUpperCase());

export const toCamelCase = (str: string) => str.replace(str[0], str[0].toLowerCase());

export const last = <T>(array: T[]) => array[array.length - 1];

export function memoize<T extends Function>(func: T, resolver?: (...args: any[]) => any): T {
  /* istanbul ignore if */
  if (typeof func !== 'function' || (resolver && typeof resolver !== 'function')) {
    throw new TypeError('FUNC_ERROR_TEXT');
  }

  const memoized = function (this: any, ...args: any[]) {
    const key = resolver ? resolver.apply(this, args) : String(args[0]);
    const cache = memoized.cache;
    if (cache.has(key)) return cache.get(key);
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };

  memoized.cache = new Map();
  return memoized as any;
}
