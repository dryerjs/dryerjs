import { Field } from '@nestjs/graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { CreateInputType, OutputType, UpdateInputType } from './type-functions';
import { ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  options: {
    allowApis: Array<'findAll' | 'findOne' | 'create' | 'update' | 'remove'>;
  };
};

export function Embedded(typeFunction: EmbeddedConfig['typeFunction'], options?: EmbeddedConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    const schema = SchemaFactory.createForClass(typeFunction());
    schema.virtual('id').get(function () {
      return (this['_id'] as any).toHexString();
    });

    const isArray = Reflect.getMetadata(MetaKey.DesignType, target, propertyKey) === Array;
    Prop({ type: isArray ? [schema] : schema })(target, propertyKey);
    Thunk(
      Field(() => (isArray ? [OutputType(typeFunction())] : OutputType(typeFunction())), { nullable: true }),
      { scopes: 'output' },
    )(target, propertyKey);
    Thunk(
      Field(() => (isArray ? [CreateInputType(typeFunction())] : CreateInputType(typeFunction())), {
        nullable: true,
      }),
      { scopes: 'create' },
    )(target, propertyKey);
    Thunk(
      Field(() => (isArray ? [UpdateInputType(typeFunction())] : UpdateInputType(typeFunction())), {
        nullable: true,
      }),
      { scopes: 'update' },
    )(target, propertyKey);
    if (isArray) {
      Thunk(ValidateNested({ each: true }), { scopes: 'input' })(target, propertyKey);
    } else {
      Thunk(ValidateNested(), { scopes: 'input' })(target, propertyKey);
      Thunk(ValidateIf((_, value) => value !== null))(target, propertyKey);
    }
    Thunk(
      Type(() => UpdateInputType(typeFunction())),
      { scopes: 'update' },
    )(target, propertyKey);
    Thunk(
      Type(() => CreateInputType(typeFunction())),
      { scopes: 'create' },
    )(target, propertyKey);

    Metadata.for(target)
      .with(propertyKey)
      .set<EmbeddedConfig>(MetaKey.EmbeddedType, {
        typeFunction,
        options: util.defaultTo(options, {
          allowApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
        }),
      });
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

export type HasOneConfig = {
  typeFunction: () => any;
  options: {
    to: string;
  };
};
export function HasOne(typeFunction: HasOneConfig['typeFunction'], options: HasOneConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.for(target).with(propertyKey).set<HasOneConfig>(MetaKey.HasOneType, { typeFunction, options });
  };
}

export type HasManyConfig = {
  typeFunction: () => any;
  options: {
    to: string;
  };
};
export function HasMany(typeFunction: HasManyConfig['typeFunction'], options: HasManyConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    ExcludeOnDatabase()(target, propertyKey);
    Metadata.for(target).with(propertyKey).set<HasManyConfig>(MetaKey.HasManyType, { typeFunction, options });
  };
}

export function ExcludeOnDatabase() {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set(MetaKey.ExcludeOnDatabase, true);
  };
}

export type FilterOperator =
  | 'eq'
  | 'in'
  | 'notEq'
  | 'notIn'
  | 'contains'
  | 'notContains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'regex'
  | 'notRegex'
  | 'all'
  | 'exists';

export const allOperators: FilterOperator[] = [
  'eq',
  'in',
  'notEq',
  'notIn',
  'contains',
  'notContains',
  'gt',
  'gte',
  'lt',
  'lte',
  'regex',
  'notRegex',
  'all',
  'exists',
];

export function Filterable(typeFn: () => any, input: { operators: FilterOperator[] }) {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set(MetaKey.Filterable, {
      typeFn,
      input,
    });
  };
}

export function Sortable() {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set(MetaKey.Sortable, true);
  };
}
