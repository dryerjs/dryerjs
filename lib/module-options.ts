import { Provider } from '@nestjs/common';
import { Schema } from 'mongoose';
import { Definition } from './definition';
import { ContextDecorator } from './context';

export type ResolverDecorator = {
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

export type ResolverConfig = {
  definition: Definition;
  decorators: ResolverDecorator;
};

export type DryerModuleOptions = {
  definitions: Definition[];
  contextDecorator?: ContextDecorator;
  hooks?: Provider[];
  onSchema?: (schema: Schema, definition: Definition) => void;
  resolverConfigs?: ResolverConfig[];
};

export const DRYER_MODULE_OPTIONS = Symbol('DryerModuleOptions');
