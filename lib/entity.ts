import { Schema } from '@nestjs/mongoose';
import { Typer } from './typer';

export function Entity(): ClassDecorator {
  return (target: object) => {
    Typer.getCreateInputType(target);
    Typer.getUpdateInputType(target);
    Typer.getObjectType(target);
    Typer.getPaginatedOutputType(target);
    Schema()(target as any);
  };
}
