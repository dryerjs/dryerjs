import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { CreateInputTypeWithin, OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasManyConfig } from '../property';
import { ContextDecorator, defaultContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';
import { StringLikeId } from '../shared';

export function createResolverForHasMany(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<HasManyConfig>(MetaKey.HasManyType);
  const relationDefinition = relation.typeFunction();
  // have to init the type here if not server will not start, there might be a better place to put this
  CreateInputTypeWithin(relationDefinition, definition, relation.options.to);
  const loaderKey = Symbol(`loader_${definition.name}_${field}`);

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasMany<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    private getLoader(ctx: any, rawCtx: any) {
      if (rawCtx.req[loaderKey]) return rawCtx.req[loaderKey];
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const field = relation.options.to;
        const items = await this.baseService.findAll(ctx, { [field]: { $in: keys } }, {});
        return keys.map((id) => {
          return items.filter((item) => String(item[field]) === String(id));
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
    ): Promise<T[]> {
      return await this.getLoader(ctx, rawCtx).load(parent._id);
    }
  }

  return GeneratedResolverForHasMany;
}
