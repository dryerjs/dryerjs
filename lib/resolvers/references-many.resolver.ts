import * as DataLoader from 'dataloader';
import { Provider } from '@nestjs/common';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { ReferencesManyConfig } from '../property';
import { ContextDecorator, defaultContextDecorator } from '../context';
import { StringLikeId } from '../shared';
import { BaseService, InjectBaseService } from '../base.service';

export function createResolverForReferencesMany(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<ReferencesManyConfig>(MetaKey.ReferencesManyType);
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
  class GeneratedResolverForReferencesMany<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    private getLoader(ctx: any, rawCtx: any) {
      if (rawCtx.req[loaderKey]) return rawCtx.req[loaderKey];
      const loader = new DataLoader<StringLikeId[], any>(async (keys) => {
        const flattenKeys: StringLikeId[] = keys.flat();
        const items = await this.baseService.findAll(ctx, { _id: { $in: flattenKeys } }, {});
        return keys.map((ids: StringLikeId[]) => {
          return items.filter((item) => ids.some((id) => id.toString() === item._id.toString()));
        });
      });
      rawCtx.req[loaderKey] = loader;
      return rawCtx.req[loaderKey];
    }

    @IfApiAllowed(ResolveField(() => [OutputType(relationDefinition)], { name: field }))
    async reference(
      @Parent() parent: any,
      @contextDecorator() ctx: any,
      @defaultContextDecorator() rawCtx: any,
    ): Promise<T[]> {
      return await this.getLoader(ctx, rawCtx).load(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForReferencesMany;
}
