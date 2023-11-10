import * as DataLoader from 'dataloader';
import { Provider } from '@nestjs/common';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { ReferencesManyConfig } from '../property';
import { ContextDecorator } from '../context';
import { StringLikeId } from '../shared';
import { BaseService, InjectBaseService } from '../base.service';

export function createResolverForReferencesMany(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<ReferencesManyConfig>(MetaKey.ReferencesManyType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForReferencesMany<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    @ResolveField()
    async [field](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T[]> {
      const loader = new DataLoader<StringLikeId[], any>(async (keys) => {
        const flattenKeys: StringLikeId[] = keys.flat();
        const field = relation.options.to || '_id';
        const items = await this.baseService.findAll(ctx, { [field]: { $in: flattenKeys } }, {});
        return keys.map((ids: StringLikeId[]) => {
          return items.filter((item) => ids.some((id) => id.toString() === item._id.toString()));
        });
      });
      return await loader.load(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForReferencesMany;
}
