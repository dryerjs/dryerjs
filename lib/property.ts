import {
  ReturnTypeFunc,
  ReturnTypeFuncValue,
  FieldOptions,
  GqlTypeReference,
} from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import * as util from './util';

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
  return (target: object, propertyKey: string | symbol) => {
    if (
      propertyKey !== 'id' &&
      util.isUndefined(embeddedCached[target.constructor.name]?.[propertyKey])
    ) {
      Prop()(target, propertyKey);
    }
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
  return (target: object, propertyKey: string | symbol) => {
    objectCached[target.constructor.name] = {
      ...(objectCached[target.constructor.name] || {}),
      [propertyKey]: {
        returnTypeFunction,
        options,
      },
    };
  };
}

type ThunkScope = 'all' | 'create' | 'update' | 'input' | 'output';

type ThunkOptions = {
  scopes: Array<ThunkScope> | ThunkScope;
};

export const hasScope = (option: ThunkOptions, checkScope: ThunkScope) => {
  const mapping = {
    all: ['create', 'update', 'output'],
    input: ['create', 'update'],
  };

  const normalizedScopes = util.isArray(option.scopes)
    ? option.scopes
    : [option.scopes];

  for (const scope of normalizedScopes) {
    if (mapping[scope as string]?.includes(checkScope)) return true;
    if (scope === checkScope) return true;
  }

  return false;
};

export const thunkCached = {};
export function Thunk(
  fn: any,
  options: ThunkOptions = { scopes: 'all' },
): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol) => {
    thunkCached[target.constructor.name] = {
      ...(thunkCached[target.constructor.name] || {}),
      [propertyKey]: [
        ...(thunkCached[target.constructor.name]?.[propertyKey] || []),
        { fn, options },
      ],
    };
  };
}

export const embeddedCached = {};
export function Embedded(fn: any) {
  return (target: object, propertyKey: string | symbol) => {
    embeddedCached[target.constructor.name] = {
      ...(embeddedCached[target.constructor.name] || {}),
      [propertyKey]: fn,
    };
  };
}

export const referencesManyCache = {};
export function ReferencesMany(fn: any) {
  return (target: object, propertyKey: string | symbol) => {
    referencesManyCache[target.constructor.name] = {
      ...(referencesManyCache[target.constructor.name] || {}),
      [propertyKey]: fn,
    };
  };
}
