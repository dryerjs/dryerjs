import { Provider } from '@nestjs/common';
import { Schema } from 'mongoose';
import { Definition } from './definition';
import { ContextDecorator } from './context';
import { AllowedApiType } from './shared';

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

export type EmbeddedResolverDecorator = {
  default?: MethodDecorator | MethodDecorator[];
  write?: MethodDecorator | MethodDecorator[];
  read?: MethodDecorator | MethodDecorator[];
  findOne?: MethodDecorator | MethodDecorator[];
  findAll?: MethodDecorator | MethodDecorator[];
  remove?: MethodDecorator | MethodDecorator[];
  update?: MethodDecorator | MethodDecorator[];
  create?: MethodDecorator | MethodDecorator[];
};

export type ResolverConfig = {
  definition: Definition;
  decorators: ResolverDecorator;
  allowedApis?: AllowedApiType | AllowedApiType[];
};

export type EmbeddedResolverConfig = {
  definition: Definition;
  decorators?: ResolverDecorator;
  property: string;
  allowedApis?: Array<'findAll' | 'findOne' | 'create' | 'update' | 'remove'>;
};

export type DryerModuleOptions = {
  definitions: Definition[];
  contextDecorator?: ContextDecorator;
  hooks?: Provider[];
  onSchema?: (schema: Schema, definition: Definition) => void;
  resolverConfigs?: ResolverConfig[];
  embeddedResolverConfigs?: EmbeddedResolverConfig[];
};

export const DRYER_MODULE_OPTIONS = Symbol('DryerModuleOptions');
