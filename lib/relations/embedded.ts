import { Schema } from 'mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ValidateNested, ValidateIf } from 'class-validator';

import * as util from '../util';
import { CreateInputType, OutputType, UpdateInputType } from '../type-functions';
import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';
import { Property } from '../property';

export type EmbeddedConfig = {
  typeFunction: () => any;
  options: {
    allowApis?: Array<'findAll' | 'findOne' | 'create' | 'update' | 'remove'>;
    onSubSchema?: (subSchema: Schema) => void;
    resolverDecorators?: {
      default?: MethodDecorator | MethodDecorator[];
      write?: MethodDecorator | MethodDecorator[];
      read?: MethodDecorator | MethodDecorator[];
      findOne?: MethodDecorator | MethodDecorator[];
      findAll?: MethodDecorator | MethodDecorator[];
      remove?: MethodDecorator | MethodDecorator[];
      update?: MethodDecorator | MethodDecorator[];
      create?: MethodDecorator | MethodDecorator[];
    };
  };
};

export function Embedded(typeFunction: EmbeddedConfig['typeFunction'], options?: EmbeddedConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    const subSchema = SchemaFactory.createForClass(typeFunction());
    subSchema.virtual('id').get(function () {
      return (this['_id'] as any).toHexString();
    });
    options?.onSubSchema?.(subSchema);

    const isArray = Reflect.getMetadata(MetaKey.DesignType, target, propertyKey) === Array;
    if (isArray) {
      Thunk(ValidateNested({ each: true }), { scopes: 'input' })(target, propertyKey);
    } else {
      Thunk(ValidateNested(), { scopes: 'input' })(target, propertyKey);
      Thunk(ValidateIf((_, value) => value !== null))(target, propertyKey);
    }
    Metadata.for(target)
      .with(propertyKey)
      .set<EmbeddedConfig>(MetaKey.EmbeddedType, {
        typeFunction,
        options: util.defaultTo(options, {
          allowApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
        }),
      });
    Thunk(
      Type(() => UpdateInputType(typeFunction())),
      { scopes: 'update' },
    )(target, propertyKey);
    Thunk(
      Type(() => CreateInputType(typeFunction())),
      { scopes: 'create' },
    )(target, propertyKey);
    return Property({
      create: {
        type: () => (isArray ? [CreateInputType(typeFunction())] : CreateInputType(typeFunction())),
        nullable: true,
      },
      update: {
        type: () => (isArray ? [UpdateInputType(typeFunction())] : UpdateInputType(typeFunction())),
        nullable: true,
      },
      output: {
        type: () => (isArray ? [OutputType(typeFunction())] : OutputType(typeFunction())),
        nullable: true,
      },
      db: {
        type: isArray ? [subSchema] : subSchema,
      },
    })(target, propertyKey);
  };
}
