import { Schema } from '@nestjs/mongoose';
import { CreateInputType, UpdateInputType, OutputType, PaginatedOutputType } from './type-functions';
import { MetaKey, Metadata } from './metadata';
import { AllowedApiType } from './shared';

type EntityOptions = {
  allowedApis: AllowedApiType | AllowedApiType[];
};

export function Entity(options: EntityOptions = { allowedApis: 'essentials' }): ClassDecorator {
  return (target: object) => {
    Metadata.for(target).set(MetaKey.Entity, options);
    CreateInputType(target);
    UpdateInputType(target);
    OutputType(target);
    PaginatedOutputType(target);
    Schema()(target as any);
  };
}
