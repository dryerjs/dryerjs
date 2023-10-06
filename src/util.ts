export { plural, singular } from 'pluralize';

export const isNil = (value: any): value is null | undefined => value === null || value === undefined;

export const isNotNil = (value: any) => !isNil(value);

export const isObject = (value: any): value is object => typeof value === 'object';

export const isNotNullObject = (value: any): value is object => typeof value === 'object' && value !== null;

export const isFunction = (value: any) => typeof value === 'function';

export const isUndefined = (value: any): value is undefined => typeof value === 'undefined';

export const isTruthy = (value: any) => !!value;

export const isString = (value: any): value is string => typeof value === 'string';

export const defaultTo = <T>(value: T | null | undefined, defaultValue: T): T => {
    return value != null && !isNaN(value as any) ? value : defaultValue;
};

export const isEnumOfNumbers = (enumObject: any) => {
    return Object.values(enumObject).some((value: string) => '0123456789'.includes(value));
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
