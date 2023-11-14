import { ModuleRef } from '@nestjs/core';
import { AllDefinitions, Hook } from './hook';
import { HydratedProperty, inspect } from './inspect';
import { BaseService, getBaseServiceToken } from './base.service';
import { DryerModuleOptions, DryerModuleOptionsSymbol } from './module-options';
import { Inject } from '@nestjs/common';
import { Definition } from './definition';
import * as util from './util';
import { getModelToken } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import * as graphql from 'graphql';

@Hook(() => AllDefinitions)
export class DefaultHook implements Hook<any, any> {
  private getCachedReferencingProperties: (definition: Definition) => HydratedProperty[];

  constructor(
    @Inject(DryerModuleOptionsSymbol) private moduleOptions: DryerModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {
    this.getCachedReferencingProperties = util.memoize(this.getUncachedReferencingProperties.bind(this));
  }

  public async beforeCreate({
    ctx,
    input,
    definition,
  }: Parameters<Required<Hook>['beforeCreate']>[0]): Promise<void> {
    for (const property of inspect(definition).belongsToProperties) {
      const { options } = property.getBelongsTo();
      if (!input[options.from]) continue;
      const parentBaseService = this.moduleRef.get(
        getBaseServiceToken(property.getBelongsTo().typeFunction()),
        {
          strict: false,
        },
      ) as BaseService;
      await parentBaseService.findOne(ctx, { _id: input[options.from] });
    }
  }

  public async beforeUpdate({
    ctx,
    input,
    definition,
  }: Parameters<Required<Hook>['beforeUpdate']>[0]): Promise<void> {
    for (const property of inspect(definition).belongsToProperties) {
      const { options } = property.getBelongsTo();
      if (!input[options.from]) continue;
      const baseServiceForRelation = this.moduleRef.get(
        getBaseServiceToken(property.getBelongsTo().typeFunction()),
        { strict: false },
      ) as BaseService;
      const filter = {
        _id: input[options.from],
      };
      await baseServiceForRelation.findOne(ctx, filter);
    }
  }

  public async beforeRemove({
    ctx,
    beforeRemoved,
    definition,
  }: Parameters<Required<Hook>['beforeRemove']>[0]): Promise<void> {
    const referencingProperties = this.getCachedReferencingProperties(definition);
    for (const referencingProperty of referencingProperties) {
      const referencingModel = this.moduleRef.get(getModelToken(referencingProperty.definition.name), {
        strict: false,
      }) as PaginateModel<any>;
      const fieldName = referencingProperty.getReferencesMany().options.from;
      const referencingObject = await referencingModel.findOne({
        [fieldName]: beforeRemoved._id,
      });
      if (util.isNotNullObject(referencingObject)) {
        const message = `${definition.name} ${beforeRemoved._id} is still in used on ${referencingProperty.definition.name} ${referencingObject['_id']}`;
        throw new graphql.GraphQLError(message);
      }
    }

    for (const hasManyProperty of inspect(definition).hasManyProperties) {
      const { options } = hasManyProperty.getHasMany();
      const baseServiceForRelation = this.moduleRef.get(
        getBaseServiceToken(hasManyProperty.getHasMany().typeFunction()),
        {
          strict: false,
        },
      ) as BaseService;
      const filter = { [options.to]: { $eq: beforeRemoved._id } };
      const hasManyObjects = await baseServiceForRelation.findAll(ctx, filter, {});
      if (hasManyObjects.some((object) => util.isNotNullObject(object))) {
        const message = `Unable to delete ${definition.name} with the Id ${beforeRemoved.id} as it still maintains a relations with associated ${hasManyProperty.name}`;
        throw new graphql.GraphQLError(message);
      }
    }

    for (const hasOneProperty of inspect(definition).hasOneProperties) {
      const { options } = hasOneProperty.getHasOne();
      const baseServiceForRelation = this.moduleRef.get(
        getBaseServiceToken(hasOneProperty.getHasOne().typeFunction()),
        {
          strict: false,
        },
      );

      const filter = {
        [options.to]: { $eq: beforeRemoved._id },
      };
      const hasOneObject = await baseServiceForRelation.findOne(ctx, filter);
      if (util.isNotNullObject(hasOneObject)) {
        const message = `Unable to delete ${definition.name} with the Id ${beforeRemoved.id} as it still maintains a relationship with an associated ${hasOneProperty.name}`;
        throw new graphql.GraphQLError(message);
      }
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

  private getReferencingProperties(definition: Definition) {
    return util.memoize(this.getUncachedReferencingProperties.bind(this))(definition);
  }
}
