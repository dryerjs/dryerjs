import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { BelongsToConfig } from '../property';
import { ContextDecorator } from '../context';
import { StringLikeId } from '../shared';
import { BaseService, InjectBaseService } from '../base.service';

export function createResolverForBelongsTo(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<BelongsToConfig>(MetaKey.BelongsToType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForBelongsTo<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    @ResolveField()
    async [field](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T> {
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const items = await this.baseService.findAll(ctx, { _id: { $in: keys } }, {});
        return keys.map((id: StringLikeId) => {
          return items.find((item) => item._id.toString() === id.toString());
        });
      });
      return await loader.load(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForBelongsTo;
}
