import { Schema } from '@nestjs/mongoose';
import { Typer } from './typer';

export function Entity(): ClassDecorator {
  return (target: object) => {
    Typer.for(target).create;
    Typer.for(target).update;
    Typer.for(target).output;
    Typer.for(target).paginate;
    Schema()(target as any);
  };
}
