import { Schema } from '@nestjs/mongoose';
import {
  CreateInputType,
  UpdateInputType,
  OutputType,
  PaginatedOutputType,
  BulkCreateOutputType,
  BulkRemoveOutputType,
} from './type-functions';
import { MetaKey, Metadata } from './metadata';
import { AllowedApiType } from './shared';

type DefinitionOptions = {
  allowedApis: AllowedApiType | AllowedApiType[];
};

export type Definition = any;

export function Definition(options: DefinitionOptions = { allowedApis: 'essentials' }): ClassDecorator {
  return (target: object) => {
    Metadata.for(target).set(MetaKey.Definition, options);
    CreateInputType(target);
    UpdateInputType(target);
    OutputType(target);
    BulkCreateOutputType(target);
    BulkRemoveOutputType(target);
    PaginatedOutputType(target);
    Schema()(target as any);
  };
}
