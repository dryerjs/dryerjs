import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { BelongsToConfig } from '../property';
import { ContextDecorator, defaultContextDecorator } from '../context';
import { StringLikeId } from '../shared';
import { BaseService, InjectBaseService } from '../base.service';

export function createResolverForBelongsTo(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<BelongsToConfig>(MetaKey.BelongsToType);
  const relationDefinition = relation.typeFunction();
  const loaderKey = Symbol(`loader_${definition.name}_${field}`);

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForBelongsTo<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    private getLoader(ctx: any, rawCtx: any) {
      if (rawCtx.req[loaderKey]) return rawCtx.req[loaderKey];
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const items = await this.baseService.findAll(ctx, { _id: { $in: keys } }, {});
        return keys.map((id: StringLikeId) => {
          return items.find((item) => item._id.toString() === id.toString());
        });
      });
      rawCtx.req[loaderKey] = loader;
      return rawCtx.req[loaderKey];
    }

    @ResolveField()
    async [field](
      @Parent() parent: any,
      @contextDecorator() ctx: any,
      @defaultContextDecorator() rawCtx: any,
    ): Promise<T> {
      return await this.getLoader(ctx, rawCtx).load(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForBelongsTo;
}
