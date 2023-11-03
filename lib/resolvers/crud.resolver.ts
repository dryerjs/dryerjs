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
  UpdateInputType,
} from '../type-functions';
import { ApiType } from '../shared';
import { BaseService } from '../base.service';
import { SuccessResponse } from '../types';
import { inspect } from '../inspect';
import { Definition } from '../definition';
import { ArrayValidationPipe, appendIdAndTransform } from './shared';
import { InjectBaseService } from '../base.service';
import { Ctx } from '../context';

export function createResolver(definition: Definition): Provider {
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
      @Ctx() context: any,
    ) {
      return await this.baseService.create(context, input);
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
      @Ctx() context: any,
    ) {
      const response: any[] = [];
      for (const input of inputs) {
        try {
          const result = await this.create(input, context);
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
      @Ctx() context: any,
    ) {
      const response: any[] = [];
      for (const input of inputs) {
        try {
          const result = await this.update(input, context);
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
    ) {
      const response: any[] = [];
      for (const id of ids) {
        try {
          await this.remove(id);
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
      @Ctx() context: any,
    ) {
      return await this.baseService.update(context, input);
    }

    @IfApiAllowed(Query(() => OutputType(definition), { name: definition.name.toLowerCase() }))
    async getOne(@Args('id', { type: () => graphql.GraphQLID }) id: string): Promise<T> {
      return await this.baseService.getOne(id);
    }

    @IfApiAllowed(Query(() => [OutputType(definition)], { name: `all${util.plural(definition.name)}` }))
    async getAll(): Promise<T[]> {
      return await this.baseService.getAll();
    }

    @IfApiAllowed(Mutation(() => SuccessResponse, { name: `remove${definition.name}` }))
    async remove(@Args('id', { type: () => graphql.GraphQLID }) id: string) {
      return await this.baseService.remove(id);
    }

    @IfApiAllowed(
      Query(() => PaginatedOutputType(definition), { name: `paginate${util.plural(definition.name)}` }),
    )
    async paginate(
      @Args('page', { type: () => graphql.GraphQLInt, defaultValue: 1 }) page: number,
      @Args('limit', { type: () => graphql.GraphQLInt, defaultValue: 10 }) limit: number,
      @IfArg(
        Args('filter', { type: () => FilterType(definition), defaultValue: {} }),
        util.isNotNil(FilterType(definition)),
      )
      filter = {},
    ) {
      return await this.baseService.paginate(filter, page, limit);
    }
  }

  return GeneratedResolver as any;
}
