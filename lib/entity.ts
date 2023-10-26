import { Schema } from '@nestjs/mongoose';
import { Typer } from './typer';

export function Entity(): ClassDecorator {
  return (target: object) => {
    Typer.for(target).get('create');
    Typer.for(target).get('update');
    Typer.for(target).get('output');
    Typer.for(target).get('paginate');
    Schema()(target as any);
  };
}
