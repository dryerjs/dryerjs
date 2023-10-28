import { Field } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';

export function Property(...input: Parameters<typeof Field>): PropertyDecorator & MethodDecorator {
  // TODO: Add validation for input
  const [returnTypeFunction, options] = input;
  return (target: object, propertyKey: string | symbol) => {
    const property = Metadata.for(target).with(propertyKey);
    if (util.isArray(property.get(MetaKey.Thunk))) {
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
    property.set(MetaKey.UseProperty, true);
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
    const property = Metadata.for(target).with(propertyKey);
    if (property.get(MetaKey.UseProperty)) {
      throw new Error(`Property ${propertyKey.toString()} already has a @Property decorator`);
    }
    const prevThunks = property.get(MetaKey.Thunk);
    if (propertyKey !== 'id' && !property.get(MetaKey.ExcludeOnDatabase) && util.isNil(prevThunks)) {
      Prop()(target, propertyKey);
    }
    const newThunks = util.defaultTo(prevThunks, []).concat({ fn, options });
    property.set(MetaKey.Thunk, newThunks);
  };
}

export type EmbeddedConfig = {
  typeFunction: () => any;
};

export function Embedded(typeFunction: EmbeddedConfig['typeFunction']) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.for(target).with(propertyKey).set<EmbeddedConfig>(MetaKey.EmbeddedType, { typeFunction });
  };
}

export type ReferencesManyConfig = {
  typeFunction: () => any;
  options: {
    from: string;
    to?: string;
  };
};

export function ReferencesMany(
  typeFunction: ReferencesManyConfig['typeFunction'],
  options: ReferencesManyConfig['options'],
) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.for(target)
      .with(propertyKey)
      .set<ReferencesManyConfig>(MetaKey.ReferencesManyType, { typeFunction, options });
  };
}

export function ExcludeOnDatabase() {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set(MetaKey.ExcludeOnDatabase, true);
  };
}
