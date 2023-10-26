import { Schema } from '@nestjs/mongoose';
import { Typer } from './typer';

export function Entity(): ClassDecorator {
  return (target: object) => {
    Typer(target).create;
    Typer(target).update;
    Typer(target).output;
    Typer(target).paginate;
    Schema()(target as any);
  };
}
