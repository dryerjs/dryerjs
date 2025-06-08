import { ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AfterRemoveHookInput,
  BeforeCreateHook,
  AllDefinitions,
  BeforeUpdateHook,
  BeforeRemoveHook,
  AfterRemoveHook,
  BeforeCreateHookInput,
  BeforeUpdateHookInput,
  BeforeRemoveHookInput,
} from './hook';
import { HydratedProperty, inspect } from './inspect';
import { DRYER_DEFINITIONS } from './module-options';
import { Definition, DefinitionOptions, HookMethod } from './definition';
import * as util from './util';
import { ObjectId } from './object-id';
import { RemoveMode, RemoveOptions } from './remove-options';
import { getBaseServiceToken } from './base.service';
import { HasManyConfig, HasOneConfig } from './relations';
import { MetaKey, Metadata } from './metadata';
import { StringLikeId } from './shared';

export const FAIL_CLEAN_UP_AFTER_REMOVE_HANDLER = Symbol('FailCleanUpAfterRemoveHandler');
export interface FailCleanUpAfterRemoveHandler<Context = any> {
  handleItem(input: AfterRemoveHookInput<any, Context>, error: Error): Promise<void>;
  handleAll(input: AfterRemoveHookInput<any, Context>, error: Error): Promise<void>;
}

@Injectable()
export class DefaultHook {
  private getCachedReferencingProperties: (definition: Definition) => HydratedProperty[];
  private isHookMethodSkip: (definition: Definition, method: HookMethod) => boolean;

  constructor(
    @Inject(DRYER_DEFINITIONS) private definitions: Definition[],
    private readonly moduleRef: ModuleRef,
  ) {
    this.getCachedReferencingProperties = util.memoize(this.getUncachedReferencingProperties.bind(this));
    this.isHookMethodSkip = util.memoize(
      this.uncachedIsHookMethodSkip.bind(this),
      (definition, method) => `${definition.name}:${method}`,
    );
  }

  private uncachedIsHookMethodSkip(definition: Definition, method: HookMethod) {
    const definitionOptions = Metadata.for(definition).get<DefinitionOptions>(MetaKey.Definition);
    const skippedMethods = util.defaultTo(definitionOptions.skipDefaultHookMethods, []);
    return skippedMethods.includes(method) || skippedMethods.includes('all');
  }

  @BeforeCreateHook(() => AllDefinitions)
  public async beforeCreate({ input, definition }: BeforeCreateHookInput<any>): Promise<void> {
    if (this.isHookMethodSkip(definition, 'beforeCreate')) return;
    for (const referencingManyProperty of inspect(definition).referencesManyProperties) {
      const { options, typeFunction } = referencingManyProperty.getReferencesMany();
      if (options.skipExistenceCheck) continue;
      if (util.isNil(input[options.from])) continue;
      for (const newId of input[options.from]) {
        await this.mustExist(typeFunction(), newId);
      }
    }

    for (const property of inspect(definition).belongsToProperties) {
      const { options, typeFunction } = property.getBelongsTo();
      if (options.skipExistenceCheck) continue;
      if (util.isNil(input[options.from])) continue;
      await this.mustExist(typeFunction(), input[options.from]);
    }
  }

  private async mustExist(definition: Definition, id: ObjectId) {
    const model = this.moduleRef.get(getModelToken(definition.name), {
      strict: false,
    });
    const exists = await model.exists({ _id: id });
    if (exists) return;
    const message = `No ${definition.name} found with ID: ${id.toString()}`;
    throw new NotFoundException(message);
  }

  private async mustNotExist(input: {
    fromDefinition: Definition;
    fromObject: any;
    toDefinition: Definition;
    fieldName: string;
  }) {
    const model = this.moduleRef.get(getModelToken(input.toDefinition.name), {
      strict: false,
    });
    const exists = await model.exists({ [input.fieldName]: input.fromObject._id });
    if (!exists) return;
    const message = `${input.fromDefinition.name} ${input.fromObject._id} has link(s) to ${input.toDefinition.name}`;
    throw new ConflictException(message);
  }

  @BeforeUpdateHook(() => AllDefinitions)
  public async beforeUpdate({ input, beforeUpdated, definition }: BeforeUpdateHookInput): Promise<void> {
    if (this.isHookMethodSkip(definition, 'beforeUpdate')) return;
    for (const referencingManyProperty of inspect(definition).referencesManyProperties) {
      const { options } = referencingManyProperty.getReferencesMany();
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
    throw new BadRequestException(message);
  }

  @BeforeRemoveHook(() => AllDefinitions)
  public async beforeRemove({ beforeRemoved, definition, options }: BeforeRemoveHookInput): Promise<void> {
    if (this.isHookMethodSkip(definition, 'beforeRemove')) return;
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
      if (options.skipRelationCheckOnRemove) continue;
      await this.mustNotExist({
        fromDefinition: definition,
        toDefinition: typeFunction(),
        fromObject: beforeRemoved,
        fieldName: options.to,
      });
    }
  }

  @AfterRemoveHook(() => AllDefinitions)
  public async afterRemove(input: AfterRemoveHookInput): Promise<void> {
    if (this.isHookMethodSkip(input.definition, 'afterRemove')) return;
    if (input.options.mode !== RemoveMode.CleanUpRelationsAfterRemoved) return;
    await Promise.resolve();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.cleanUpRelationsAfterRemoved(input);
  }

  private getFailHandler() {
    try {
      return this.moduleRef.get(FAIL_CLEAN_UP_AFTER_REMOVE_HANDLER, { strict: false });
    } catch {
      const defaultFailHandler: FailCleanUpAfterRemoveHandler = {
        handleItem(_input: AfterRemoveHookInput, error: Error) {
          throw error;
        },
        handleAll(_input: AfterRemoveHookInput, error: Error) {
          throw error;
        },
      };
      return defaultFailHandler;
    }
  }

  private async cleanUpRelationsAfterRemoved(input: AfterRemoveHookInput) {
    const failHandler = this.getFailHandler();
    try {
      const referencingProperties = this.getCachedReferencingProperties(input.definition);
      for (const referencingProperty of referencingProperties) {
        const { options } = referencingProperty.getReferencesMany();
        const items = await this.moduleRef
          .get(getModelToken(referencingProperty.definition.name), {
            strict: false,
          })
          .find({ [options.from]: input.removed._id }, { _id: 1, [options.from]: 1 });

        const baseService = this.moduleRef.get(getBaseServiceToken(referencingProperty.definition), {
          strict: false,
        });

        for (const item of items) {
          try {
            await baseService.update(input.ctx, {
              id: item._id,
              [options.from]: item[options.from].filter(
                (id: StringLikeId) => id.toString() !== input.removed._id.toString(),
              ),
            });
          } catch (error: any) {
            /* istanbul ignore next */
            await failHandler.handleItem(input, error);
          }
        }
      }

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
        });

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
    for (const possibleDefinition of this.definitions) {
      for (const property of inspect(possibleDefinition).referencesManyProperties) {
        if (property.getReferencesMany().typeFunction() === definition) {
          result.push(property);
        }
      }
    }
    return result;
  }
}
