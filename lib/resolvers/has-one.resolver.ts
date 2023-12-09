import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { MetaKey, Metadata } from '../metadata';
import { CreateInputTypeWithin, OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasOneConfig } from '../relations';
import { ContextDecorator, defaultContextDecorator } from '../context';
import { StringLikeId } from '../shared';
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
  const loaderKey = Symbol(`loader_${definition.name}_${field}`);

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

    private getLoader(ctx: any, rawCtx: any) {
      if (rawCtx.req[loaderKey]) return rawCtx.req[loaderKey];
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const field = relation.options.to;
        const items = await this.baseService.findAll(ctx, { [field]: { $in: keys } }, {});
        const transformedItems = items.map((item) =>
          plainToInstance(OutputType(relationDefinition), item.toObject()),
        );
        return keys.map((id: StringLikeId) => {
          return transformedItems.find((item) => item[field].toString() === id.toString());
        });
      });
      rawCtx.req[loaderKey] = loader;
      return rawCtx.req[loaderKey];
    }

    @IfApiAllowed(ResolveField(() => OutputType(relationDefinition), { name: field }))
    async findOne(
      @Parent() parent: any,
      @contextDecorator() ctx: any,
      @defaultContextDecorator() rawCtx: any,
    ): Promise<T> {
      return await this.getLoader(ctx, rawCtx).load(parent._id);
    }
  }

  return GeneratedResolverForHasOne;
}
