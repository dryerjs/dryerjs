import { ModuleRef } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import * as graphql from 'graphql';
import { Inject } from '@nestjs/common';

import { AllDefinitions, Hook } from './hook';
import { HydratedProperty, inspect } from './inspect';
import { DryerModuleOptions, DryerModuleOptionsSymbol } from './module-options';
import { Definition } from './definition';
import * as util from './util';
import { ObjectId } from './object-id';

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
    input,
    definition,
  }: Parameters<Required<Hook>['beforeCreate']>[0]): Promise<void> {
    for (const property of inspect(definition).belongsToProperties) {
      const { options, typeFunction } = property.getBelongsTo();
      if (!input[options.from]) continue;
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
    definition,
  }: Parameters<Required<Hook>['beforeUpdate']>[0]): Promise<void> {
    for (const property of inspect(definition).belongsToProperties) {
      const { options, typeFunction } = property.getBelongsTo();
      if (!input[options.from]) continue;
      await this.mustExist(typeFunction(), input[options.from]);
    }
  }

  public async beforeRemove({
    beforeRemoved,
    definition,
  }: Parameters<Required<Hook>['beforeRemove']>[0]): Promise<void> {
    const referencingProperties = this.getCachedReferencingProperties(definition);
    for (const referencingProperty of referencingProperties) {
      await this.mustNotExist({
        fromDefinition: definition,
        toDefinition: referencingProperty.definition,
        fromObject: beforeRemoved,
        fieldName: referencingProperty.getReferencesMany().options.from,
      });
    }

    for (const hasManyProperty of inspect(definition).hasManyProperties) {
      const { options, typeFunction } = hasManyProperty.getHasMany();
      await this.mustNotExist({
        fromDefinition: definition,
        toDefinition: typeFunction(),
        fromObject: beforeRemoved,
        fieldName: options.to,
      });
    }

    for (const hasOneProperty of inspect(definition).hasOneProperties) {
      const { options, typeFunction } = hasOneProperty.getHasOne();
      await this.mustNotExist({
        fromDefinition: definition,
        toDefinition: typeFunction(),
        fromObject: beforeRemoved,
        fieldName: options.to,
      });
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
