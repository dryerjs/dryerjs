import * as graphql from 'graphql';
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

@Hook(() => AllDefinitions)
export class DefaultHook implements Hook<any, any> {
  constructor(
    @Inject(DryerModuleOptionsSymbol) private moduleOptions: DryerModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

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

  public async beforeRemove({
    beforeRemoved,
    definition,
  }: Parameters<Required<Hook>['beforeRemove']>[0]): Promise<void> {
    const referencingProperties = this.getReferencingProperties(definition);
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
  }
}
