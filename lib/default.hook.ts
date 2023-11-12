import { ModuleRef } from '@nestjs/core';
import { AllDefinitions, Hook } from './hook';
import { inspect } from './inspect';
import { BaseService, getBaseServiceToken } from './base.service';

@Hook(() => AllDefinitions)
export class DefaultHook implements Hook<any, any> {
  constructor(private readonly moduleRef: ModuleRef) {}

  public async beforeCreate({ ctx, input, definition }: Parameters<Hook['beforeCreate']>[0]): Promise<void> {
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
}
