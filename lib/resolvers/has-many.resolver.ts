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
import { ContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';
import { QueryContext, QueryContextSource, QueryContextSymbol } from '../shared';
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
        (propertyKey.startsWith('findAll') && relation.options.allowFindAll === true) ||
        (propertyKey.startsWith('paginate') && relation.options.allowPaginate === true);
      if (isAllowed) {
        decorator(target, propertyKey, descriptor);
      }
      return descriptor;
    };
  }

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasMany<T> {
    constructor(@InjectBaseService(relationDefinition) public baseService: BaseService) {}

    @IfApiAllowed(ResolveField(() => [OutputType(relationDefinition)], { name: field }))
    [`findAll_${field}`](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T[]> {
      return this.baseService
        .getFieldLoader({
          ctx,
          field: relation.options.to,
          parent,
          parentDefinition: definition,
          source: QueryContextSource.HasMany,
          transform: true,
        })
        .safeLoad(parent._id)
        .then((result) => util.defaultTo(result, []));
    }

    @IfApiAllowed(
      ResolveField(() => PaginatedOutputType(relationDefinition), {
        nullable: true,
        name: `paginate${util.toPascalCase(field)}`,
      }),
    )
    async [`paginate_${field}`](
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
          [relation.options.to]: parent._id,
          [QueryContextSymbol]: {
            source: QueryContextSource.HasMany,
            parent,
            parentDefinition: definition,
          } as QueryContext,
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
