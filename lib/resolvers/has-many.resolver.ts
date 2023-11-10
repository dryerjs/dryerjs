import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasManyConfig } from '../property';
import { ContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';
import { StringLikeId } from '../shared';

export function createResolverForHasMany(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<HasManyConfig>(MetaKey.HasManyType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasMany<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    @ResolveField()
    async [field](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T[]> {
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const field = relation.options.to;
        const items = await this.baseService.findAll(ctx, { [field]: { $in: keys } }, {});
        return keys.map((id) => {
          return items.filter((item) => String(item[field]) === String(id));
        });
      });
      return await loader.load(parent._id);
    }
  }

  return GeneratedResolverForHasMany;
}
