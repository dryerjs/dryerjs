import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasOneConfig } from '../property';
import { ContextDecorator } from '../context';
import { StringLikeId } from '../shared';
import { BaseService, InjectBaseService } from '../base.service';

export function createResolverForHasOne(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<HasOneConfig>(MetaKey.HasOneType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasOne<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    @ResolveField()
    async [field](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T> {
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const field = relation.options.to;
        const items = await this.baseService.findAll(ctx, { [field]: { $in: keys } }, {});
        return keys.map((id: StringLikeId) => {
          return items.find((item) => item[field].toString() === id.toString());
        });
      });
      return await loader.load(parent._id);
    }
  }

  return GeneratedResolverForHasOne;
}
