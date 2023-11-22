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
import { AllowedApiType } from './shared';

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
  allowedApis?: AllowedApiType | AllowedApiType[];
  removalConfig?: {
    allowIgnoreRelationCheck?: boolean;
    allowCleanUpRelationsAfterRemoved?: boolean;
  };
  enableTextSearch?: boolean;
  resolverDecorators?: {
    default?: MethodDecorator | MethodDecorator[];
    write?: MethodDecorator | MethodDecorator[];
    read?: MethodDecorator | MethodDecorator[];
    findOne?: MethodDecorator | MethodDecorator[];
    list?: MethodDecorator | MethodDecorator[];
    findAll?: MethodDecorator | MethodDecorator[];
    paginate?: MethodDecorator | MethodDecorator[];
    remove?: MethodDecorator | MethodDecorator[];
    update?: MethodDecorator | MethodDecorator[];
    create?: MethodDecorator | MethodDecorator[];
    bulkCreate?: MethodDecorator | MethodDecorator[];
    bulkUpdate?: MethodDecorator | MethodDecorator[];
    bulkRemove?: MethodDecorator | MethodDecorator[];
  };
  schemaOptions?: SchemaOptions;
  skipDefaultHookMethods?: HookMethod[];
  timestamps?: boolean;
};

export type Definition = any;

export function Definition(options: DefinitionOptions = { allowedApis: 'essentials' }): ClassDecorator {
  return (target: object) => {
    Metadata.for(target).set(MetaKey.Definition, options);
    CreateInputType(target as any);
    UpdateInputType(target as any);
    OutputType(target as any);
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
