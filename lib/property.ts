import { Field, FieldOptions, ReturnTypeFunc } from '@nestjs/graphql';
import { Prop, PropOptions } from '@nestjs/mongoose';

import { FilterOperator, GraphQLObjectId, ObjectId } from './shared';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { Thunk } from './thunk';

type OverrideOptions = Partial<FieldOptions> & { type?: ReturnTypeFunc };

export const Skip = Symbol('Skip');

export type DryerPropertyInput = FieldOptions & {
  type?: ReturnTypeFunc;
  create?: OverrideOptions | typeof Skip;
  update?: OverrideOptions | typeof Skip;
  output?: OverrideOptions | typeof Skip;
  db?: PropOptions | typeof Skip;
};

export function Property(input: DryerPropertyInput = {}): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.for(target).with(propertyKey).set(MetaKey.Property, input);
    const baseOptions = util.omit(input, ['create', 'update', 'output', 'db']);
    if (input.create !== Skip) {
      const createOptions = {
        ...baseOptions,
        ...util.defaultTo(input.create, {}),
      };
      if (createOptions.type) {
        Thunk(Field(createOptions.type, createOptions), { scopes: 'create' })(target, propertyKey);
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
    const idType = Reflect.getMetadata('design:type', target, propertyKey);

    if (idType !== ObjectId) {
      throw new Error(`Property ${String(propertyKey)} should have type ObjectId`);
    }

    Property({
      type: () => GraphQLObjectId,
      create: Skip,
      db: Skip,
      update: { type: () => GraphQLObjectId, nullable: false },
    })(target, propertyKey);
  };
}

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
