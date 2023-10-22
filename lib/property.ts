import {
  ReturnTypeFunc,
  ReturnTypeFuncValue,
  FieldOptions,
  GqlTypeReference,
} from '@nestjs/graphql';

export const defaultCached = {};
type FieldOptionsExtractor<T> = T extends [GqlTypeReference<infer P>]
  ? FieldOptions<P[]>
  : T extends GqlTypeReference<infer P>
  ? FieldOptions<P>
  : never;

export function Property<T extends ReturnTypeFuncValue>(
  returnTypeFunction?: ReturnTypeFunc<T>,
  options?: FieldOptionsExtractor<T>,
): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol | number) => {
    defaultCached[target.constructor.name] = {
      ...(defaultCached[target.constructor.name] || {}),
      [propertyKey]: {
        returnTypeFunction,
        options,
      },
    };
  };
}

export const objectCached = {};
export function OutputProperty<T extends ReturnTypeFuncValue>(
  returnTypeFunction?: ReturnTypeFunc<T>,
  options?: FieldOptionsExtractor<T>,
): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol | number) => {
    objectCached[target.constructor.name] = {
      ...(objectCached[target.constructor.name] || {}),
      [propertyKey]: {
        returnTypeFunction,
        options,
      },
    };
  };
}

export const thunkCached = {};
export function Thunk(value: any): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol | number) => {
    thunkCached[target.constructor.name] = {
      ...(thunkCached[target.constructor.name] || {}),
      [propertyKey]: [
        ...(thunkCached[target.constructor.name]?.[propertyKey] || []),
        value,
      ],
    };
  };
}

export const embeddedCached = {};
export function Embedded(fn: any) {
  return (target: object, propertyKey: string | symbol | number) => {
    embeddedCached[target.constructor.name] = {
      ...(embeddedCached[target.constructor.name] || {}),
      [propertyKey]: fn,
    };
  };
}

export const hasManyCached = {};
export function HasMany(fn: any) {
  return (target: object, propertyKey: string | symbol | number) => {
    hasManyCached[target.constructor.name] = {
      ...(hasManyCached[target.constructor.name] || {}),
      [propertyKey]: fn,
    };
  };
}

export const hasOneCached = {};
export function HasOne(fn: any) {
  return (target: object, propertyKey: string | symbol | number) => {
    hasOneCached[target.constructor.name] = {
      ...(hasOneCached[target.constructor.name] || {}),
      [propertyKey]: fn,
    };
  };
}

export const belongToCache = {};
export function BelongsTo(fn: any) {
  return (target: object, propertyKey: string | symbol | number) => {
    belongToCache[target.constructor.name] = {
      ...(belongToCache[target.constructor.name] || {}),
      [propertyKey]: fn,
    };
  };
}

export const referencesManyCache = {};
export function ReferencesMany(fn: any) {
  return (target: object, propertyKey: string | symbol | number) => {
    referencesManyCache[target.constructor.name] = {
      ...(referencesManyCache[target.constructor.name] || {}),
      [propertyKey]: fn,
    };
  };
}
