import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { CreateInputTypeWithin, OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasOneConfig } from '../relations';
import { ContextDecorator } from '../context';
import { QueryContextSource } from '../shared';
import { BaseService, InjectBaseService } from '../base.service';

export function createResolverForHasOne(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<HasOneConfig>(MetaKey.HasOneType);
  const relationDefinition = relation.typeFunction();
  // have to init the type here if not server will not start, there might be a better place to put this
  CreateInputTypeWithin(relationDefinition, definition, relation.options.to);

  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      /* istanbul ignore if */
      if (relation.options.noPopulation === true) {
        return descriptor;
      }
      decorator(target, propertyKey, descriptor);
    };
  }

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasOne<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    @IfApiAllowed(ResolveField(() => OutputType(relationDefinition), { name: field, nullable: true }))
    [`findOne_${field}`](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T> {
      return this.baseService
        .getFieldLoader({
          ctx,
          field: relation.options.to,
          parent,
          parentDefinition: definition,
          source: QueryContextSource.HasOne,
          transform: true,
        })
        .safeLoad(parent._id)
        .then((result) => result?.[0]);
    }
  }

  return GeneratedResolverForHasOne;
}
