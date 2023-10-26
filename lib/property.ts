import { Field } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';

export function Property(...input: Parameters<typeof Field>): PropertyDecorator & MethodDecorator {
  // TODO: Add validation for input
  const [returnTypeFunction, options] = input;
  return (target: object, propertyKey: string | symbol) => {
    if (Metadata.getMetaValue(target, MetaKey.Thunk, propertyKey)) {
      throw new Error(`Property ${propertyKey.toString()} already has a @Thunk decorator`);
    }
    const isId = propertyKey === 'id';
    if (isId) {
      Thunk(Field(returnTypeFunction, { ...options, nullable: false }), { scopes: ['update', 'output'] })(
        target,
        propertyKey,
      );
    } else {
      Thunk(Field(returnTypeFunction, { ...options, nullable: true }), { scopes: 'update' })(
        target,
        propertyKey,
      );
      Thunk(Field(returnTypeFunction, options), { scopes: ['output', 'create'] })(target, propertyKey);
    }
    Metadata.setProperty(target, MetaKey.UseProperty, propertyKey, true);
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
    if (Metadata.getMetaValue(target, MetaKey.UseProperty, propertyKey)) {
      throw new Error(`Property ${propertyKey.toString()} already has a @Property decorator`);
    }
    const prevThunks = Metadata.getMetaValue(target, MetaKey.Thunk, propertyKey);
    if (
      propertyKey !== 'id' &&
      !Metadata.getMetaValue(target, MetaKey.ExcludeOnDatabase, propertyKey) &&
      util.isNil(prevThunks)
    ) {
      Prop()(target, propertyKey);
    }
    const newThunks = util.defaultTo(prevThunks, []).concat({ fn, options });
    Metadata.setProperty(target, MetaKey.Thunk, propertyKey, newThunks);
  };
}

export function Embedded(fn: any) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.setProperty(target, MetaKey.EmbeddedType, propertyKey, fn);
  };
}

export function ReferencesMany(fn: any, options: { from: string; to?: string }) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.setProperty(target, MetaKey.ReferencesManyType, propertyKey, { fn, options });
  };
}

export function ExcludeOnDatabase() {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.setProperty(target, MetaKey.ExcludeOnDatabase, propertyKey, true);
  };
}

export function ExcludeOnCreate() {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.setProperty(target, MetaKey.ExcludeOnCreate, propertyKey, true);
  };
}
