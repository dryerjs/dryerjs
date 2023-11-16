import { ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import * as graphql from 'graphql';
import { Inject } from '@nestjs/common';

import { AllDefinitions, Hook } from './hook';
import { HydratedProperty, inspect } from './inspect';
import { DryerModuleOptions, DRYER_MODULE_OPTIONS } from './module-options';
import { Definition, DefinitionOptions } from './definition';
import * as util from './util';
import { ObjectId } from './object-id';
import { RemoveMode, RemoveOptions } from './remove-options';
import { BaseService, getBaseServiceToken } from './base.service';
import { HasManyConfig, HasOneConfig } from './relations';
import { MetaKey, Metadata } from './metadata';
import { StringLikeId } from './shared';

export const FAIL_CLEAN_UP_AFTER_REMOVE_HANDLER = Symbol('FailCleanUpAfterRemoveHandler');
export interface FailCleanUpAfterRemoveHandler {
  handleItem(input: Parameters<Required<Hook>['afterRemove']>[0], error: Error): Promise<void>;
  handleAll(input: Parameters<Required<Hook>['afterRemove']>[0], error: Error): Promise<void>;
}

@Hook(() => AllDefinitions)
export class DefaultHook implements Hook<any, any> {
  private getCachedReferencingProperties: (definition: Definition) => HydratedProperty[];

  constructor(
    @Inject(DRYER_MODULE_OPTIONS) private moduleOptions: DryerModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {
    this.getCachedReferencingProperties = util.memoize(this.getUncachedReferencingProperties.bind(this));
  }

  public async beforeCreate({
    input,
    definition,
  }: Parameters<Required<Hook>['beforeCreate']>[0]): Promise<void> {
    for (const referencingManyProperty of inspect(definition).referencesManyProperties) {
      const { options, typeFunction } = referencingManyProperty.getReferencesMany();
      /* istanbul ignore if */
      if (options.skipExistenceCheck) continue;
      if (util.isNil(input[options.from])) continue;
      for (const newId of input[options.from]) {
        await this.mustExist(typeFunction(), newId);
      }
    }

    for (const property of inspect(definition).belongsToProperties) {
      const { options, typeFunction } = property.getBelongsTo();
      /* istanbul ignore if */
      if (options.skipExistenceCheck) continue;
      if (util.isNil(input[options.from])) continue;
      await this.mustExist(typeFunction(), input[options.from]);
    }
  }

  private async mustExist(definition: Definition, id: ObjectId) {
    const model = this.moduleRef.get(getModelToken(definition.name), {
      strict: false,
    }) as PaginateModel<any>;
    const exists = await model.exists({ _id: id });
    if (exists) return;
    const message = `No ${definition.name} found with ID: ${id}`;
    throw new graphql.GraphQLError(message);
  }

  private async mustNotExist(input: {
    fromDefinition: Definition;
    fromObject: any;
    toDefinition: Definition;
    fieldName: string;
  }) {
    const model = this.moduleRef.get(getModelToken(input.toDefinition.name), {
      strict: false,
    }) as PaginateModel<any>;
    const exists = await model.exists({ [input.fieldName]: input.fromObject._id });
    if (!exists) return;
    const message = `${input.fromDefinition.name} ${input.fromObject._id} has link(s) to ${input.toDefinition.name}`;
    throw new graphql.GraphQLError(message);
  }

  public async beforeUpdate({
    input,
    beforeUpdated,
    definition,
  }: Parameters<Required<Hook>['beforeUpdate']>[0]): Promise<void> {
    for (const referencingManyProperty of inspect(definition).referencesManyProperties) {
      const { options } = referencingManyProperty.getReferencesMany();
      /* istanbul ignore if */
      if (options.skipExistenceCheck) continue;
      if (util.isNil(input[options.from])) continue;
      const toString = (ids: StringLikeId[]) => ids.map((id) => id.toString()).join(',');
      if (toString(beforeUpdated[options.from]) !== toString(input[options.from])) {
        const oldStringIds = beforeUpdated[options.from].map((id: StringLikeId) => id.toString()) as string[];
        for (const newId of input[options.from]) {
          if (oldStringIds.includes(newId.toString())) continue;
          await this.mustExist(referencingManyProperty.getReferencesMany().typeFunction(), newId);
        }
      }
    }

    for (const property of inspect(definition).belongsToProperties) {
      const { options, typeFunction } = property.getBelongsTo();
      /* istanbul ignore if */
      if (options.skipExistenceCheck) continue;
      if (util.isNil(input[options.from])) continue;
      if (input[options.from]?.toString() === beforeUpdated[options.from]?.toString()) continue;
      await this.mustExist(typeFunction(), input[options.from]);
    }
  }

  private ensureRemoveModeValid(definition: Definition, options: RemoveOptions) {
    if (options.isIndirectCall) return;
    const definitionOptions = Metadata.for(definition).get<DefinitionOptions>(MetaKey.Definition);
    if (options.mode === RemoveMode.RequiredCleanRelations) return;
    if (
      options.mode === RemoveMode.IgnoreRelations &&
      definitionOptions.removalConfig?.allowIgnoreRelationCheck === true
    ) {
      return;
    }
    if (
      options.mode === RemoveMode.CleanUpRelationsAfterRemoved &&
      definitionOptions.removalConfig?.allowCleanUpRelationsAfterRemoved === true
    ) {
      return;
    }
    const message = `Remove mode ${options.mode} is not allowed for ${definition.name}`;
    throw new graphql.GraphQLError(message);
  }

  public async beforeRemove({
    beforeRemoved,
    definition,
    options,
  }: Parameters<Required<Hook>['beforeRemove']>[0]): Promise<void> {
    this.ensureRemoveModeValid(definition, options);
    if ([RemoveMode.IgnoreRelations, RemoveMode.CleanUpRelationsAfterRemoved].includes(options.mode)) return;
    const referencingProperties = this.getCachedReferencingProperties(definition);
    for (const referencingProperty of referencingProperties) {
      /* istanbul ignore if */
      if (referencingProperty.getReferencesMany().options.skipRelationCheckOnRemove) continue;
      await this.mustNotExist({
        fromDefinition: definition,
        toDefinition: referencingProperty.definition,
        fromObject: beforeRemoved,
        fieldName: referencingProperty.getReferencesMany().options.from,
      });
    }

    for (const hasManyProperty of inspect(definition).hasManyProperties) {
      const { options, typeFunction } = hasManyProperty.getHasMany();
      /* istanbul ignore if */
      if (options.skipRelationCheckOnRemove) continue;
      await this.mustNotExist({
        fromDefinition: definition,
        toDefinition: typeFunction(),
        fromObject: beforeRemoved,
        fieldName: options.to,
      });
    }

    for (const hasOneProperty of inspect(definition).hasOneProperties) {
      const { options, typeFunction } = hasOneProperty.getHasOne();
      /* istanbul ignore if */
      if (options.skipRelationCheckOnRemove) continue;
      await this.mustNotExist({
        fromDefinition: definition,
        toDefinition: typeFunction(),
        fromObject: beforeRemoved,
        fieldName: options.to,
      });
    }
  }

  public async afterRemove(input: Parameters<Required<Hook>['afterRemove']>[0]): Promise<void> {
    if (input.options.mode !== RemoveMode.CleanUpRelationsAfterRemoved) return;
    this.cleanUpRelationsAfterRemoved(input);
  }

  private getFailHandler() {
    try {
      return this.moduleRef.get(FAIL_CLEAN_UP_AFTER_REMOVE_HANDLER, { strict: false });
    } catch (error) {
      const defaultFailHandler: FailCleanUpAfterRemoveHandler = {
        handleItem(_input: Parameters<Required<Hook>['afterRemove']>[0], error: Error) {
          throw error;
        },
        handleAll(_input: Parameters<Required<Hook>['afterRemove']>[0], error: Error) {
          throw error;
        },
      };
      return defaultFailHandler;
    }
  }

  private async cleanUpRelationsAfterRemoved(input: Parameters<Required<Hook>['afterRemove']>[0]) {
    const failHandler = this.getFailHandler();
    try {
      const configs: Array<HasManyConfig | HasOneConfig> = [];
      for (const hasManyProperty of inspect(input.definition).hasManyProperties) {
        configs.push(hasManyProperty.getHasMany());
      }
      for (const hasOneProperty of inspect(input.definition).hasOneProperties) {
        configs.push(hasOneProperty.getHasOne());
      }

      for (const config of configs) {
        const baseService = this.moduleRef.get(getBaseServiceToken(config.typeFunction()), {
          strict: false,
        }) as BaseService<any>;

        const items = await this.moduleRef
          .get(getModelToken(config.typeFunction().name), { strict: false })
          .find({ [config.options.to]: input.removed._id });

        for (const item of items) {
          try {
            await baseService.remove(input.ctx, item._id, {
              mode: RemoveMode.CleanUpRelationsAfterRemoved,
              isIndirectCall: true,
            });
          } catch (error: any) {
            await failHandler.handleItem(input, error);
          }
        }
      }
    } catch (error) {
      await failHandler.handleAll(input, error);
    }
  }

  private getUncachedReferencingProperties(definition: Definition) {
    const result: HydratedProperty[] = [];
    for (const possibleDefinition of this.moduleOptions.definitions) {
      for (const property of inspect(possibleDefinition).referencesManyProperties) {
        if (property.getReferencesMany().typeFunction() === definition) {
          result.push(property);
        }
      }
    }
    return result;
  }
}
