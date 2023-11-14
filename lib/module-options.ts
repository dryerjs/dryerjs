import { Provider } from '@nestjs/common';
import { Schema } from 'mongoose';
import { Definition } from './definition';
import { ContextDecorator } from './context';

export type DryerModuleOptions = {
  definitions: Definition[];
  contextDecorator?: ContextDecorator;
  hooks?: Provider[];
  onSchema?: (schema: Schema, definition: Definition) => void;
};

export const DryerModuleOptionsSymbol = Symbol('DryerModuleOptionsSymbol');
