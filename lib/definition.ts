import { Schema, SchemaOptions } from '@nestjs/mongoose';
import * as util from './util';
import {
  CreateInputType,
  UpdateInputType,
  OutputType,
  PaginatedOutputType,
  BulkCreateOutputType,
  BulkRemoveOutputType,
  BulkUpdateOutputType,
  FilterType,
  SortType,
} from './type-functions';
import { MetaKey, Metadata } from './metadata';

export type HookMethod =
  | 'all'
  | 'beforeCreate'
  | 'afterCreate'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeFindOne'
  | 'afterFindOne'
  | 'beforeRemove'
  | 'afterRemove'
  | 'beforeFindMany'
  | 'afterFindMany';

export type DefinitionOptions = {
  removalConfig?: {
    allowIgnoreRelationCheck?: boolean;
    allowCleanUpRelationsAfterRemoved?: boolean;
  };
  enableTextSearch?: boolean;
  schemaOptions?: SchemaOptions;
  skipDefaultHookMethods?: HookMethod[];
  timestamps?: boolean;
};

export type Definition = new (...args: any[]) => any;

export function Definition(options: DefinitionOptions = {}): ClassDecorator {
  return (target: any) => {
    Metadata.for(target).set(MetaKey.Definition, options);
    CreateInputType(target);
    UpdateInputType(target);
    OutputType(target);
    BulkCreateOutputType(target);
    BulkUpdateOutputType(target);
    BulkRemoveOutputType(target);
    PaginatedOutputType(target);
    FilterType(target);
    SortType(target);

    const normalizedSchemaOptions = util.defaultTo(options.schemaOptions, {
      toJSON: {},
      toObject: {},
    });

    Schema({
      timestamps: options.timestamps,
      ...normalizedSchemaOptions,
      toJSON: { ...util.defaultTo(normalizedSchemaOptions.toJSON, {}), virtuals: true },
      toObject: { ...util.defaultTo(normalizedSchemaOptions.toObject, {}), virtuals: true },
    })(target as any);
  };
}
