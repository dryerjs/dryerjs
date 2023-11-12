import { Schema } from '@nestjs/mongoose';
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

type DefinitionOptions = {
  allowedApis: AllowedApiType | AllowedApiType[];
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
    Schema({ toJSON: { virtuals: true }, toObject: { virtuals: true } })(target as any);
  };
}
