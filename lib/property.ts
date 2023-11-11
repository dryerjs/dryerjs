import { Field, FieldOptions, ReturnTypeFunc } from '@nestjs/graphql';
import { Prop, PropOptions, SchemaFactory } from '@nestjs/mongoose';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { CreateInputType, OutputType, UpdateInputType } from './type-functions';
import { ValidateIf, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GraphQLObjectId } from './shared';

type OverrideOptions = Partial<FieldOptions> & { type?: ReturnTypeFunc };

export const Skip = Symbol('Skip');

type DryerPropertyInput = FieldOptions & {
  type?: ReturnTypeFunc;
  create?: OverrideOptions | typeof Skip;
  update?: OverrideOptions | typeof Skip;
  output?: OverrideOptions | typeof Skip;
  db?: PropOptions | typeof Skip;
};

export function Property(input: DryerPropertyInput = {}): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const baseOptions = util.omit(input, ['create', 'update', 'output', 'db']);
    if (input.create !== Skip) {
      const createOptions = {
        ...baseOptions,
        ...util.defaultTo(input.create, {}),
      };
      if (createOptions.type) {
        Thunk(Field(input.type, createOptions), { scopes: 'create' })(target, propertyKey);
      } else {
        Thunk(Field(createOptions), { scopes: 'create' })(target, propertyKey);
      }
    }

    if (input.update !== Skip) {
      const updateOptions = {
        ...baseOptions,
        nullable: true,
        ...util.defaultTo(input.update, {}),
      };
      if (updateOptions.type) {
        Thunk(Field(updateOptions.type, updateOptions), { scopes: 'update' })(target, propertyKey);
      } else {
        Thunk(Field(updateOptions), { scopes: 'update' })(target, propertyKey);
      }
    }

    if (input.output !== Skip) {
      const outputOptions = {
        ...baseOptions,
        ...util.defaultTo(input.output, {}),
      };
      if (outputOptions.type) {
        Thunk(Field(outputOptions.type, outputOptions), { scopes: 'output' })(target, propertyKey);
      } else {
        Thunk(Field(outputOptions), { scopes: 'output' })(target, propertyKey);
      }
    }

    if (input.db !== Skip) {
      Prop(input.db)(target, propertyKey);
    }
  };
}

export function Id() {
  return (target: object, propertyKey: string | symbol) => {
    Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })(target, propertyKey);
    Thunk(Transform(({ obj, key }) => obj[key]))(target, propertyKey);
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
    const prevThunks = property.get(MetaKey.Thunk);
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
    Thunk(
      Field(() => [OutputType(typeFunction())]),
      { scopes: 'output' },
    )(target, propertyKey);
    Thunk(
      Field(() => [CreateInputType(typeFunction())], { nullable: true }),
      { scopes: 'create' },
    )(target, propertyKey);
    Thunk(
      Type(() => CreateInputType(typeFunction())),
      { scopes: 'create' },
    )(target, propertyKey);
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
    Thunk(
      Field(() => OutputType(typeFunction()), { nullable: true }),
      { scopes: 'output' },
    )(target, propertyKey);
    Thunk(
      Field(() => CreateInputType(typeFunction()), { nullable: true }),
      { scopes: 'create' },
    )(target, propertyKey);
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
    Thunk(
      Field(() => [OutputType(typeFunction())], { nullable: true }),
      { scopes: 'output' },
    )(target, propertyKey);
    Thunk(
      Field(() => [CreateInputType(typeFunction())], { nullable: true }),
      { scopes: 'create' },
    )(target, propertyKey);
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
