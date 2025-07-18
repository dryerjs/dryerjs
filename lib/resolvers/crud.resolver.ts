import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { HttpException, Provider, ValidationPipe } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';

import * as util from '../util';
import {
  BulkCreateOutputType,
  BulkRemoveOutputType,
  BulkUpdateOutputType,
  CreateInputType,
  FilterType,
  OutputType,
  PaginatedOutputType,
  SortType,
  UpdateInputType,
} from '../type-functions';
import {
  AllowedApiType,
  ApiType,
  GraphQLObjectId,
  ObjectId,
  ObjectIdLike,
  QueryContext,
  QueryContextSource,
  QueryContextSymbol,
} from '../shared';
import { BaseService } from '../base.service';
import { SuccessResponse } from '../types';
import { ArrayValidationPipe, applyDecorators } from './shared';
import { InjectBaseService } from '../base.service';
import { ContextDecorator } from '../context';
import { MongoHelper } from '../mongo-helper';
import { RemoveOptions } from '../remove-options';
import { BULK_ERROR_HANDLER, BulkErrorHandler } from '../bulk-error-handler';
import { DefinitionWithConfig } from '../module-options';

export const isApiAllowed = (
  api: ApiType,
  allowedApis: undefined | AllowedApiType | AllowedApiType[],
): boolean => {
  const normalizedAllowedApis = util.isArray(allowedApis)
    ? allowedApis
    : [util.defaultTo(allowedApis, 'essentials')];
  for (const allowedApi of normalizedAllowedApis) {
    if (allowedApi === '*') return true;
    if (allowedApi === 'essentials') {
      return ['create', 'update', 'findOne', 'remove', 'paginate'].includes(api);
    }
    if (allowedApi === api) return true;
  }
  return false;
};

export function createResolver(
  definitionWithConfig: DefinitionWithConfig,
  contextDecorator: ContextDecorator,
): Provider {
  const definition = definitionWithConfig.definition;
  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const allowedApis = definitionWithConfig?.allowedApis;
      if (isApiAllowed(propertyKey as ApiType, allowedApis ?? 'essentials')) {
        decorator(target, propertyKey, descriptor);
      }
      return descriptor;
    };
  }

  function IfArg(decorator: ParameterDecorator, condition: boolean) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
      if (condition) {
        decorator(target, propertyKey, parameterIndex);
      }
    };
  }

  const resolverDecorators = definitionWithConfig?.decorators ?? {};

  @Resolver()
  class GeneratedResolver<T> {
    private bulkErrorHandler: BulkErrorHandler<any> | null = null;

    constructor(
      @InjectBaseService(definition) public baseService: BaseService,
      public readonly moduleRef: ModuleRef,
    ) {
      try {
        this.bulkErrorHandler = this.moduleRef.get(BULK_ERROR_HANDLER, { strict: false });
      } catch {
        // do nothing
      }
    }

    @applyDecorators(
      util.defaultToChain(resolverDecorators.create, resolverDecorators.write, resolverDecorators.default),
    )
    @IfApiAllowed(Mutation(() => OutputType(definition), { name: `create${definition.name}` }))
    async create(
      @Args(
        'input',
        { type: () => CreateInputType(definition) },
        new ValidationPipe({
          transform: true,
          expectedType: CreateInputType(definition),
        }),
      )
      input: any,
      @contextDecorator() ctx: any,
    ) {
      const result = await this.baseService.create(ctx, input);
      return plainToInstance(OutputType(definition), result.toObject());
    }

    @applyDecorators(
      util.defaultToChain(
        resolverDecorators.bulkCreate,
        resolverDecorators.create,
        resolverDecorators.write,
        resolverDecorators.default,
      ),
    )
    @IfApiAllowed(
      Mutation(() => [BulkCreateOutputType(definition)], {
        name: `bulkCreate${util.plural(definition.name)}`,
      }),
    )
    async bulkCreate(
      @Args(
        'inputs',
        { type: () => [CreateInputType(definition)] },
        ArrayValidationPipe(CreateInputType(definition)),
      )
      inputs: any,
      @contextDecorator() ctx: any,
    ) {
      const response: any[] = [];
      for (const input of inputs) {
        try {
          const result = await this.create(input, ctx);
          response.push({
            input,
            result,
            success: true,
          });
        } catch (error: any) {
          await this.bulkErrorHandler?.handleCreateError?.({ input, ctx, definition }, error);
          response.push({
            input,
            success: false,
            result: null,
            errorMessage: (() => {
              /* istanbul ignore if */
              if (error instanceof HttpException) return error.message;
              return 'INTERNAL_SERVER_ERROR';
            })(),
          });
        }
      }
      return response;
    }

    @applyDecorators(
      util.defaultToChain(
        resolverDecorators.bulkUpdate,
        resolverDecorators.update,
        resolverDecorators.write,
        resolverDecorators.default,
      ),
    )
    @IfApiAllowed(
      Mutation(() => [BulkUpdateOutputType(definition)], {
        name: `bulkUpdate${util.plural(definition.name)}`,
      }),
    )
    async bulkUpdate(
      @Args(
        'inputs',
        { type: () => [UpdateInputType(definition)] },
        ArrayValidationPipe(UpdateInputType(definition)),
      )
      inputs: any,
      @contextDecorator() ctx: any,
    ) {
      const response: any[] = [];
      for (const input of inputs) {
        try {
          const result = await this.update(input, ctx);
          response.push({
            input,
            result,
            success: true,
          });
        } catch (error: any) {
          await this.bulkErrorHandler?.handleUpdateError?.({ input, ctx, definition }, error);
          response.push({
            input,
            success: false,
            result: null,
            errorMessage: (() => {
              if (error instanceof HttpException) return error.message;
              /* istanbul ignore next */
              return 'INTERNAL_SERVER_ERROR';
            })(),
          });
        }
      }
      return response;
    }

    @applyDecorators(
      util.defaultToChain(
        resolverDecorators.bulkRemove,
        resolverDecorators.remove,
        resolverDecorators.write,
        resolverDecorators.default,
      ),
    )
    @IfApiAllowed(
      Mutation(() => [BulkRemoveOutputType(definition)], {
        name: `bulkRemove${util.plural(definition.name)}`,
      }),
    )
    async bulkRemove(
      @Args('ids', { type: () => [GraphQLObjectId] }) ids: ObjectId[],
      @Args('options', { nullable: true, defaultValue: undefined }) options: RemoveOptions,
      @contextDecorator() ctx: any,
    ) {
      const response: any[] = [];
      for (const id of ids) {
        try {
          await this.baseService.remove(ctx, id, options);
          response.push({ id, success: true });
        } catch (error: any) {
          await this.bulkErrorHandler?.handleRemoveError?.({ id, options, ctx, definition }, error);
          response.push({
            id,
            success: false,
            errorMessage: (() => {
              if (error instanceof HttpException) return error.message;
              /* istanbul ignore next */
              return 'INTERNAL_SERVER_ERROR';
            })(),
          });
        }
      }
      return response;
    }

    @applyDecorators(
      util.defaultToChain(resolverDecorators.update, resolverDecorators.write, resolverDecorators.default),
    )
    @IfApiAllowed(Mutation(() => OutputType(definition), { name: `update${definition.name}` }))
    async update(
      @Args(
        'input',
        { type: () => UpdateInputType(definition) },
        new ValidationPipe({
          transform: true,
          expectedType: UpdateInputType(definition),
        }),
      )
      input: any,
      @contextDecorator() ctx: any,
    ) {
      const result = await this.baseService.update(ctx, input);
      return plainToInstance(OutputType(definition), result.toObject());
    }

    @applyDecorators(
      util.defaultToChain(resolverDecorators.findOne, resolverDecorators.read, resolverDecorators.default),
    )
    @IfApiAllowed(Query(() => OutputType(definition), { name: util.toCamelCase(definition.name) }))
    async findOne(
      @Args('id', { type: () => GraphQLObjectId }) id: ObjectIdLike,
      @contextDecorator() ctx: any,
    ): Promise<T> {
      const result = await this.baseService.findById(ctx, { _id: id });
      return plainToInstance(OutputType(definition), result.toObject());
    }

    @applyDecorators(
      util.defaultToChain(
        resolverDecorators.findAll,
        resolverDecorators.list,
        resolverDecorators.read,
        resolverDecorators.default,
      ),
    )
    @IfApiAllowed(Query(() => [OutputType(definition)], { name: `all${util.plural(definition.name)}` }))
    async findAll(
      @contextDecorator() ctx: any,
      @IfArg(
        Args('filter', { type: () => FilterType(definition), nullable: true }),
        util.isNotNil(FilterType(definition)),
      )
      filter: object,
      @IfArg(
        Args('sort', { type: () => SortType(definition), nullable: true }),
        util.isNotNil(SortType(definition)),
      )
      sort: object,
    ): Promise<T[]> {
      const items = await this.baseService.findAll(
        ctx,
        {
          ...MongoHelper.toQuery(util.defaultTo(filter, {})),
          [QueryContextSymbol]: { source: QueryContextSource.RootFindAll } as QueryContext,
        },
        MongoHelper.getSortObject(filter as any, sort),
      );
      return items.map((item) => plainToInstance(OutputType(definition), item.toObject()));
    }

    @applyDecorators(
      util.defaultToChain(resolverDecorators.remove, resolverDecorators.write, resolverDecorators.default),
    )
    @IfApiAllowed(Mutation(() => SuccessResponse, { name: `remove${definition.name}` }))
    async remove(
      @Args('id', { type: () => GraphQLObjectId }) id: ObjectIdLike,
      @Args('options', { nullable: true, defaultValue: undefined }) options: RemoveOptions,
      @contextDecorator() ctx: any,
    ) {
      return await this.baseService.remove(ctx, id, options);
    }

    @applyDecorators(
      util.defaultToChain(
        resolverDecorators.paginate,
        resolverDecorators.list,
        resolverDecorators.read,
        resolverDecorators.default,
      ),
    )
    @IfApiAllowed(
      Query(() => PaginatedOutputType(definition), { name: `paginate${util.plural(definition.name)}` }),
    )
    async paginate(
      @contextDecorator() ctx: any,
      @Args('page', { type: () => graphql.GraphQLInt, defaultValue: 1 }) page: number,
      @Args('limit', { type: () => graphql.GraphQLInt, defaultValue: 10 }) limit: number,
      @IfArg(
        Args('filter', { type: () => FilterType(definition), nullable: true }),
        util.isNotNil(FilterType(definition)),
      )
      filter: object,
      @IfArg(
        Args('sort', { type: () => SortType(definition), nullable: true }),
        util.isNotNil(SortType(definition)),
      )
      sort: object,
    ) {
      const result = await this.baseService.paginate(
        ctx,
        {
          ...MongoHelper.toQuery(util.defaultTo(filter, {})),
          [QueryContextSymbol]: { source: QueryContextSource.RootPaginate } as QueryContext,
        },
        MongoHelper.getSortObject(filter as any, sort),
        page,
        limit,
      );
      return {
        ...result,
        docs: result.docs.map((item) => plainToInstance(OutputType(definition), item.toObject())),
      };
    }
  }

  return GeneratedResolver as any;
}
