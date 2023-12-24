import { Schema } from 'mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ValidateNested, ValidateIf } from 'class-validator';

import * as util from '../util';
import { CreateInputType, OutputType, UpdateInputType } from '../type-functions';
import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';
import { DryerPropertyInput, Property, Skip } from '../property';

export type EmbeddedConfig = {
  typeFunction: () => any;
  options: {
    allowedApis?: Array<'findAll' | 'findOne' | 'create' | 'update' | 'remove'>;
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
    overridePropertyOptions?: Pick<DryerPropertyInput, 'create' | 'update' | 'output' | 'db'>;
  };
};

export function Embedded(typeFunction: EmbeddedConfig['typeFunction'], options?: EmbeddedConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    const subSchema = SchemaFactory.createForClass(typeFunction());
    subSchema.virtual('id').get(function () {
      return this._id;
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
          allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
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

    const mergeOption = (option: any, override: any) => {
      if (override === Skip) return Skip;
      return {
        ...option,
        ...util.defaultTo(override, {}),
      };
    };

    return Property({
      create: mergeOption(
        {
          type: () => (isArray ? [CreateInputType(typeFunction())] : CreateInputType(typeFunction())),
          nullable: true,
        },
        options?.overridePropertyOptions?.create,
      ),
      update: mergeOption(
        {
          type: () => (isArray ? [UpdateInputType(typeFunction())] : UpdateInputType(typeFunction())),
          nullable: true,
        },
        options?.overridePropertyOptions?.update,
      ),
      output: mergeOption(
        {
          type: () => (isArray ? [OutputType(typeFunction())] : OutputType(typeFunction())),
          nullable: true,
        },
        options?.overridePropertyOptions?.output,
      ),
      db: mergeOption(
        {
          type: isArray ? [subSchema] : subSchema,
        },
        options?.overridePropertyOptions?.db,
      ),
    })(target, propertyKey);
  };
}
