import * as DataLoader from 'dataloader';
import * as graphql from 'graphql';
import { Args, Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import * as util from '../util';
import { MetaKey, Metadata } from '../metadata';
import {
  CreateInputTypeWithin,
  FilterType,
  OutputType,
  PaginatedOutputType,
  SortType,
} from '../type-functions';
import { Definition } from '../definition';
import { HasManyConfig } from '../relations';
import { ContextDecorator, defaultContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';
import { ObjectId, StringLikeId } from '../shared';
import { MongoHelper } from '../mongo-helper';
import { plainToInstance } from 'class-transformer';

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

  function IfArg(decorator: ParameterDecorator, condition: boolean) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
      if (condition) {
        decorator(target, propertyKey, parameterIndex);
      }
    };
  }

  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const isAllowed =
        (propertyKey === 'findAll' && relation.options.allowFindAll === true) ||
        (propertyKey === 'paginate' && relation.options.allowPaginate === true);
      if (isAllowed) {
        decorator(target, propertyKey, descriptor);
      }
      return descriptor;
    };
  }

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasMany<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    private getLoader(ctx: any, rawCtx: any) {
      if (rawCtx.req[loaderKey]) return rawCtx.req[loaderKey];
      const loader = new DataLoader<StringLikeId, any>(async (keys) => {
        const field = relation.options.to;
        const items = await this.baseService.findAll(ctx, { [field]: { $in: keys } }, {});
        const transformedItems = items.map((item) =>
          plainToInstance(OutputType(relationDefinition), item.toObject()),
        );
        return keys.map((id) => {
          return transformedItems.filter((item) => String(item[field]) === String(id));
        });
      });
      rawCtx.req[loaderKey] = loader;
      return rawCtx.req[loaderKey];
    }

    @IfApiAllowed(ResolveField(() => [OutputType(relationDefinition)], { name: field }))
    async findAll(
      @Parent() parent: any,
      @contextDecorator() ctx: any,
      @defaultContextDecorator() rawCtx: any,
    ): Promise<T[]> {
      return await this.getLoader(ctx, rawCtx).load(new ObjectId(parent.id));
    }

    @IfApiAllowed(
      ResolveField(() => PaginatedOutputType(relationDefinition), {
        nullable: true,
        name: `paginate${util.toPascalCase(field)}`,
      }),
    )
    async paginate(
      @Parent() parent: any,
      @contextDecorator() ctx: any,
      @Args('page', { type: () => graphql.GraphQLInt, defaultValue: 1 }) page: number,
      @Args('limit', { type: () => graphql.GraphQLInt, defaultValue: 10 }) limit: number,
      @IfArg(
        Args('filter', { type: () => FilterType(relationDefinition), nullable: true }),
        util.isNotNil(FilterType(relationDefinition)),
      )
      filter: object,
      @IfArg(
        Args('sort', { type: () => SortType(relationDefinition), nullable: true }),
        util.isNotNil(SortType(relationDefinition)),
      )
      sort: object,
    ): Promise<any> {
      const result = await this.baseService.paginate(
        ctx,
        {
          ...MongoHelper.toQuery(util.defaultTo(filter, {})),
          [relation.options.to]: new ObjectId(parent.id),
        },
        util.defaultTo(sort, {}),
        page,
        limit,
      );
      return {
        ...result,
        docs: result.docs.map((item) => plainToInstance(OutputType(relationDefinition), item.toObject())),
      };
    }
  }

  return GeneratedResolverForHasMany;
}
