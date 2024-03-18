import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { BelongsToConfig } from '../relations';
import { ContextDecorator, defaultContextDecorator } from '../context';
import { QueryContext, QueryContextSource, QueryContextSymbol, StringLikeId } from '../shared';
import { BaseService, InjectBaseService } from '../base.service';
import { plainToInstance } from 'class-transformer';

export function createResolverForBelongsTo(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<BelongsToConfig>(MetaKey.BelongsToType);
  const relationDefinition = relation.typeFunction();
  const loaderKey = Symbol(`loader_${definition.name}_${field}`);

  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (relation.options.noPopulation === true) {
        return descriptor;
      }
      decorator(target, propertyKey, descriptor);
    };
  }

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForBelongsTo<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    private getLoader(ctx: any, rawCtx: any, parent: any) {
      if (rawCtx.req[loaderKey]) return rawCtx.req[loaderKey];
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const filter = {
          _id: { $in: keys },
          [QueryContextSymbol]: {
            parent,
            parentDefinition: definition,
            source: QueryContextSource.BelongsTo,
          } as QueryContext,
        };
        const items = await this.baseService.findAll(ctx, filter, {});
        const transformedItems = items.map((item) =>
          plainToInstance(OutputType(relationDefinition), item.toObject()),
        );
        return keys.map((id: StringLikeId) => {
          return transformedItems.find((item) => item.id.toString() === id.toString());
        });
      });
      rawCtx.req[loaderKey] = loader;
      return rawCtx.req[loaderKey];
    }

    @IfApiAllowed(ResolveField(() => OutputType(relationDefinition), { name: field }))
    async [`findOne_${field}`](
      @Parent() parent: any,
      @contextDecorator() ctx: any,
      @defaultContextDecorator() rawCtx: any,
    ): Promise<T> {
      return await this.getLoader(ctx, rawCtx, parent).load(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForBelongsTo;
}
