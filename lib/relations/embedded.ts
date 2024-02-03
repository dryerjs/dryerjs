import { Schema } from 'mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { ValidateNested, ValidateIf } from 'class-validator';

import * as util from '../util';
import { CreateInputType, OutputType, UpdateEmbeddedInputType } from '../type-functions';
import { MetaKey, Metadata } from '../metadata';
import { Thunk } from '../thunk';
import { DryerPropertyInput, Property, Skip } from '../property';

export type EmbeddedConfig = {
  typeFunction: () => any;
  options: {
    onSubSchema?: (subSchema: Schema) => void;
    overridePropertyOptions?: Pick<DryerPropertyInput, 'create' | 'update' | 'output' | 'db'>;
  };
};

export function Embedded(typeFunction: EmbeddedConfig['typeFunction'], options?: EmbeddedConfig['options']) {
  return (target: object, propertyKey: string | symbol) => {
    const subSchema = SchemaFactory.createForClass(typeFunction());
    subSchema.set('id', false);
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
        options: util.defaultTo(options, {}),
      });
    Thunk(
      Type(() => UpdateEmbeddedInputType(typeFunction())),
      { scopes: 'update' },
    )(target, propertyKey);
    Thunk(
      Type(() => CreateInputType(typeFunction())),
      { scopes: 'create' },
    )(target, propertyKey);
    Thunk(
      Type(() => OutputType(typeFunction())),
      { scopes: 'output' },
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
          type: () =>
            isArray ? [UpdateEmbeddedInputType(typeFunction())] : UpdateEmbeddedInputType(typeFunction()),
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
