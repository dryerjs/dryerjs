import { Schema } from '@nestjs/mongoose';
import { CreateInputType, UpdateInputType, OutputType, PaginatedOutputType } from './type-functions';

export function Entity(): ClassDecorator {
  return (target: object) => {
    CreateInputType(target);
    UpdateInputType(target);
    OutputType(target);
    PaginatedOutputType(target);
    Schema()(target as any);
  };
}
