import { Field } from '@nestjs/graphql';
import { Schema } from 'mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ValidateNested, ValidateIf } from 'class-validator';

import * as util from '../util';
import { CreateInputType, OutputType, UpdateInputType } from '../type-functions';
import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';
import { DryerPropertyInput, Skip } from '../property';

type EmbeddedOptions = Omit<DryerPropertyInput, 'type'> & {
  allowApis: Array<'findAll' | 'findOne' | 'create' | 'update' | 'remove'>;
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

export type EmbeddedConfig = DryerPropertyInput & {
  typeFunction: () => any;
  options: EmbeddedOptions;
};

export function Embedded(typeFunction: EmbeddedConfig['typeFunction'], options?: EmbeddedConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    const subSchema = SchemaFactory.createForClass(typeFunction());
    subSchema.virtual('id').get(function () {
      return (this['_id'] as any).toHexString();
    });
    options?.onSubSchema?.(subSchema);

    const isArray = Reflect.getMetadata(MetaKey.DesignType, target, propertyKey) === Array;
    if (options?.db !== Skip) {
      Prop({ type: isArray ? [subSchema] : subSchema })(target, propertyKey);
    }
    Thunk(
      Field(() => (isArray ? [OutputType(typeFunction())] : OutputType(typeFunction())), { nullable: true }),
      { scopes: 'output' },
    )(target, propertyKey);
    if (options?.create !== Skip) {
      Thunk(
        Field(() => (isArray ? [CreateInputType(typeFunction())] : CreateInputType(typeFunction())), {
          nullable: true,
        }),
        { scopes: 'create' },
      )(target, propertyKey);
      Thunk(
        Type(() => CreateInputType(typeFunction())),
        { scopes: 'create' },
      )(target, propertyKey);
    }
    if (options?.update !== Skip) {
      Thunk(
        Field(() => (isArray ? [UpdateInputType(typeFunction())] : UpdateInputType(typeFunction())), {
          nullable: true,
        }),
        { scopes: 'update' },
      )(target, propertyKey);
      if (options?.create !== Skip) {
        Thunk(
          Type(() => UpdateInputType(typeFunction())),
          { scopes: 'update' },
        )(target, propertyKey);
      }
    }

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
  };
}
