import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider, ValidationPipe } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

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
import { ApiType } from '../shared';
import { BaseService } from '../base.service';
import { SuccessResponse } from '../types';
import { inspect } from '../inspect';
import { Definition } from '../definition';
import { ArrayValidationPipe, appendIdAndTransform } from './shared';
import { InjectBaseService } from '../base.service';
import { ContextDecorator } from '../context';

export function createResolver(definition: Definition, contextDecorator: ContextDecorator): Provider {
  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (inspect(definition).isApiAllowed(propertyKey as ApiType)) {
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

  @Resolver()
  class GeneratedResolver<T> {
    constructor(
      @InjectModel(definition.name) public model: PaginateModel<any>,
      @InjectBaseService(definition) public baseService: BaseService,
      public moduleRef: ModuleRef,
    ) {}

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
      return await this.baseService.create(ctx, input);
    }

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
          response.push({ input, result, success: true });
        } catch (error: any) {
          response.push({
            input,
            success: false,
            result: null,
            errorMessage: (() => {
              // TODO: handle server errors
              /* istanbul ignore if */
              if (error instanceof graphql.GraphQLError) return error.message;
              return 'INTERNAL_SERVER_ERROR';
            })(),
          });
        }
      }
      return response.map((item) => appendIdAndTransform(BulkCreateOutputType(definition), item)) as any;
    }

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
          response.push({ input, result, success: true });
        } catch (error: any) {
          response.push({
            input,
            success: false,
            result: null,
            errorMessage: (() => {
              if (error instanceof graphql.GraphQLError) return error.message;
              // TODO: handle server errors
              /* istanbul ignore next */
              return 'INTERNAL_SERVER_ERROR';
            })(),
          });
        }
      }
      return response.map((item) => appendIdAndTransform(BulkCreateOutputType(definition), item)) as any;
    }

    @IfApiAllowed(
      Mutation(() => [BulkRemoveOutputType(definition)], {
        name: `bulkRemove${util.plural(definition.name)}`,
      }),
    )
    async bulkRemove(
      @Args('ids', { type: () => [graphql.GraphQLID!]! })
      ids: string[],
      @contextDecorator() ctx: any,
    ) {
      const response: any[] = [];
      for (const id of ids) {
        try {
          await this.baseService.remove(ctx, id);
          response.push({ id, success: true });
        } catch (error: any) {
          response.push({
            id,
            success: false,
            errorMessage: (() => {
              if (error instanceof graphql.GraphQLError) return error.message;
              /* istanbul ignore next */
              return 'INTERNAL_SERVER_ERROR';
            })(),
          });
        }
      }
      return response.map((item) => appendIdAndTransform(BulkRemoveOutputType(definition), item)) as any;
    }

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
      return await this.baseService.update(ctx, input);
    }

    @IfApiAllowed(Query(() => OutputType(definition), { name: definition.name.toLowerCase() }))
    async getOne(
      @Args('id', { type: () => graphql.GraphQLID }) id: string,
      @contextDecorator() ctx: any,
    ): Promise<T> {
      const result = await this.baseService.getOne(ctx, { _id: id });
      return appendIdAndTransform(definition, result) as any;
    }

    @IfApiAllowed(Query(() => [OutputType(definition)], { name: `all${util.plural(definition.name)}` }))
    async getAll(
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
      return await this.baseService.getAll(util.defaultTo(filter, {}), util.defaultTo(sort, {}));
    }

    @IfApiAllowed(Mutation(() => SuccessResponse, { name: `remove${definition.name}` }))
    async remove(@Args('id', { type: () => graphql.GraphQLID }) id: string, @contextDecorator() ctx: any) {
      return await this.baseService.remove(ctx, id);
    }

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
      return await this.baseService.paginate(
        ctx,
        util.defaultTo(filter, {}),
        util.defaultTo(sort, {}),
        page,
        limit,
      );
    }
  }

  return GeneratedResolver as any;
}
