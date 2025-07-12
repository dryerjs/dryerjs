import { Provider } from '@nestjs/common';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { ReferencesManyConfig } from '../relations';
import { ContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';

export function createResolverForReferencesMany(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<ReferencesManyConfig>(MetaKey.ReferencesManyType);
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
  class GeneratedResolverForReferencesMany<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    @IfApiAllowed(ResolveField(() => [OutputType(relationDefinition)], { name: field }))
    [`reference_${field}`](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T[]> {
      return this.baseService
        .getIdLoader({ ctx, parent, transform: true })
        .safeUniqNonNullLoadMany(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForReferencesMany;
}
