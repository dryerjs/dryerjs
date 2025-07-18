/* eslint-disable no-prototype-builtins */
import { plural, singular } from './js/pluralize';

export { plural, singular };

export type FunctionLike = (...args: any[]) => any;

export const isNil = (value: any): value is null | undefined => value === null || value === undefined;

export const isNotNil = (value: any) => !isNil(value);

export const isArray = (value: any) => Array.isArray(value);

export const isNotNullObject = (value: any): value is object => typeof value === 'object' && value !== null;

export const isFunction = (value: any) => typeof value === 'function';

export const isUndefined = (value: any): value is undefined => typeof value === 'undefined';

export const isTruthy = (value: any) => !!value;

export const omit = (object: any, omitKeys: string[]) => {
  /* istanbul ignore if */
  if (!isNotNullObject(object) || Array.isArray(object)) {
    throw new Error('omit() expects an object as the first argument');
  }

  const result = {};
  for (const key in object) {
    if (object.hasOwnProperty(key) && !omitKeys.includes(key)) {
      result[key] = object[key];
    }
  }
  return result;
};

export const isString = (value: any): value is string => typeof value === 'string';

export const isNotEmptyString = (value: any): value is string => isString(value) && value.length > 0;

export const defaultTo = <T>(value: T | null | undefined, defaultValue: T): T => {
  const shouldUseDefaultValue = isNil(value) || (typeof value === 'number' && isNaN(value));
  return shouldUseDefaultValue ? defaultValue : value;
};

export const defaultToChain = <T>(...args: Array<T | null | undefined>) => {
  for (const arg of args) {
    const shouldCheckNextArg = isNil(arg) || (typeof arg === 'number' && isNaN(arg));
    const shouldReturnThisArg = !shouldCheckNextArg;
    if (shouldReturnThisArg) return arg;
  }
  return args[args.length - 1];
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

export function memoize<T extends FunctionLike>(func: T, resolver?: (...args: any[]) => any): T {
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
