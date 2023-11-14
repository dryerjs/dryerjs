import { ModuleRef } from '@nestjs/core';
import { AllDefinitions, Hook } from './hook';
import { HydratedProperty, inspect } from './inspect';
import { BaseService, getBaseServiceToken } from './base.service';
import { DryerModuleOptions, DryerModuleOptionsSymbol } from './module-options';
import { Inject } from '@nestjs/common';
import { Definition } from './definition';
import * as util from './util';

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
    ctx,
    beforeRemoved,
    definition,
  }: Parameters<Required<Hook>['beforeRemove']>[0]): Promise<void> {
    const referencingProperties = this.getReferencingProperties(definition);
    for (const referencingProperty of referencingProperties) {
      const referencingBaseService = this.moduleRef.get(getBaseServiceToken(referencingProperty.definition), {
        strict: false,
      }) as BaseService;
      // TODO: more on here
    }
  }
}
