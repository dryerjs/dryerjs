import { ReturnTypeFunc, ReturnTypeFuncValue, FieldOptions, GqlTypeReference, Field } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';

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
    Thunk(Field(returnTypeFunction, options), { scopes: 'all' })(target, propertyKey);
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

  const normalizedScopes = util.isArray(option.scopes) ? option.scopes : [option.scopes];

  for (const scope of normalizedScopes) {
    if (mapping[scope as string]?.includes(checkScope)) return true;
    if (scope === checkScope) return true;
  }

  return false;
};

export function Thunk(
  fn: any,
  options: ThunkOptions = { scopes: 'all' },
): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const prevThunks = Metadata.getMetaValue(target, MetaKey.Thunk, propertyKey);
    if (
      propertyKey !== 'id' &&
      util.isFunction(Metadata.getMetaValue(target, MetaKey.ExcludeOnDatabase, propertyKey)) &&
      util.isNil(prevThunks)
    ) {
      Prop()(target, propertyKey);
    }
    const newThunks = util.defaultTo(prevThunks, []).concat({ fn, options });
    Metadata.setProperty(target.constructor.name, MetaKey.ExcludeOnDatabase, propertyKey, newThunks);
  };
}

export function Embedded(fn: any) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.setProperty(target.constructor.name, MetaKey.EmbeddedType, propertyKey, fn);
  };
}

export function ReferencesMany(fn: any, options: { from: string; to?: string }) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.setProperty(target.constructor.name, MetaKey.EmbeddedType, propertyKey, { fn, options });
  };
}

export function ExcludeOnDatabase() {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.setProperty(target.constructor.name, MetaKey.ExcludeOnDatabase, propertyKey, true);
  };
}

export function ExcludeOnCreate() {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.setProperty(target.constructor.name, MetaKey.ExcludeOnCreate, propertyKey, true);
  };
}
