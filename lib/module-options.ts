import { ModuleMetadata } from '@nestjs/common';
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

export type EmbeddedResolverConfig = {
  decorators?: ResolverDecorator;
  property: string;
  allowedApis?: Array<'findAll' | 'findOne' | 'create' | 'update' | 'remove'>;
};

export type DefinitionWithConfig = {
  definition: Definition;
  decorators?: ResolverDecorator;
  allowedApis?: AllowedApiType | AllowedApiType[];
  embeddedConfigs?: EmbeddedResolverConfig[];
};

export type DryerModuleOptions = {
  definitions: Array<Definition | DefinitionWithConfig>;
  contextDecorator?: ContextDecorator;
  onSchema?: (schema: Schema, definition: Definition) => void;
  imports?: ModuleMetadata['imports'];
  providers?: ModuleMetadata['providers'];
};

export const DRYER_MODULE_OPTIONS = Symbol('DryerModuleOptions');
export const DRYER_DEFINITIONS = Symbol('DryerDefinitions');
