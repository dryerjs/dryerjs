import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { BelongsToConfig } from '../relations';
import { ContextDecorator, defaultContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';
import { QueryContextSource } from '../shared';

export function createResolverForBelongsTo(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<BelongsToConfig>(MetaKey.BelongsToType);
  const relationDefinition = relation.typeFunction();

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

    @IfApiAllowed(ResolveField(() => OutputType(relationDefinition), { name: field }))
    async [`findOne_${field}`](
      @Parent() parent: any,
      @contextDecorator() ctx: any,
      @defaultContextDecorator() rawCtx: any,
    ): Promise<T> {
      return await this.baseService
        .getIdLoader(ctx, rawCtx, {
          parent,
          parentDefinition: definition,
          source: QueryContextSource.BelongsTo,
          transform: true,
        })
        .safeLoad(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForBelongsTo;
}
