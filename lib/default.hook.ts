import { ModuleRef } from '@nestjs/core';
import { AllDefinitions, Hook } from './hook';
import { inspect } from './inspect';
import { BaseService, getBaseServiceToken } from './base.service';
import * as graphql from 'graphql';

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

  public async beforeRemove(input: { ctx: any; beforeRemoved: any; definition: any }): Promise<void> {
    for (const property of inspect(input.definition).hasManyProperties) {
      const { options } = property.getHasMany();
      const baseServiceForRelation = this.moduleRef.get(
        getBaseServiceToken(property.getHasMany().typeFunction()),
        {
          strict: false,
        },
      ) as BaseService;
      const filter = { [options.to]: { $eq: input.beforeRemoved._id } };
      const items = await baseServiceForRelation.findAll(input.ctx, filter, {});
      if (items.length > 0) {
        throw new graphql.GraphQLError(
          `Unable to delete ${input.definition.name} with the Id ${input.beforeRemoved.id} as it still maintains a relations with associated ${property.name}`,
        );
      }
    }

    for (const property of inspect(input.definition).hasOneProperties) {
      const { options } = property.getHasOne();
      const baseServiceForRelation = this.moduleRef.get(
        getBaseServiceToken(property.getHasOne().typeFunction()),
        {
          strict: false,
        },
      );

      const filter = {
        [options.to]: { $eq: input.beforeRemoved._id },
      };
      const item = await baseServiceForRelation.findOne(input.ctx, filter);
      if (item) {
        throw new graphql.GraphQLError(
          `Unable to delete ${input.definition.name} with the Id ${input.beforeRemoved.id} as it still maintains a relationship with an associated ${property.name}`,
        );
      }
    }
  }

  public async beforeUpdate(input: {
    ctx: any;
    input: Partial<any>;
    beforeUpdated: any;
    definition: any;
  }): Promise<void> {
    for (const property of inspect(input.definition).belongsToProperties) {
      const { options } = property.getBelongsTo();
      if (!input.input[options.from]) continue;
      const baseServiceForRelation = this.moduleRef.get(
        getBaseServiceToken(property.getBelongsTo().typeFunction()),
        { strict: false },
      ) as BaseService;
      const filter = {
        _id: input.input[options.from],
      };
      await baseServiceForRelation.findOne(input.ctx, filter);
    }
  }
}
