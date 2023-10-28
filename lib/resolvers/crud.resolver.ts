import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { PaginateModel } from 'mongoose';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Provider, ValidationPipe } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';

import * as util from '../util';
import {
  BulkCreateOutputType,
  BulkRemoveOutputType,
  CreateInputType,
  OutputType,
  PaginatedOutputType,
  UpdateInputType,
} from '../type-functions';
import { ApiType } from '../shared';
import { SuccessResponse } from '../types';
import { inspect } from '../inspect';
import { Definition } from '../definition';
import { appendIdAndTransform } from './shared';

export function createResolver(definition: Definition): Provider {
  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (inspect(definition).isApiAllowed(propertyKey as ApiType)) {
        decorator(target, propertyKey, descriptor);
      }
      return descriptor;
    };
  }

  @Resolver()
  class GeneratedResolver<T> {
    constructor(
      @InjectModel(definition.name) public model: PaginateModel<any>,
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
    ) {
      const created = await this.model.create(input);
      for (const property of inspect(definition).referencesManyProperties) {
        if (!input[property.name] || input[property.name].length === 0) continue;
        const relation = property.getReferencesMany();
        const relationDefinition = relation.fn();
        const newIds: string[] = [];
        for (const subObject of input[property.name]) {
          const relationModel = this.moduleRef.get(getModelToken(relationDefinition.name), { strict: false });
          const createdRelation = await relationModel.create(subObject);
          newIds.push(createdRelation._id);
        }
        await this.model.findByIdAndUpdate(created._id, {
          $addToSet: { [relation.options.from]: { $each: newIds } },
        });
      }
      return appendIdAndTransform(definition, await this.model.findById(created._id));
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
        // note check this for array
        new ValidationPipe({
          transform: true,
          expectedType: CreateInputType(definition),
        }),
      )
      inputs: any,
    ) {
      const response: any[] = [];
      for (const input of inputs) {
        try {
          const result = await this.create(input);
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
    ) {
      const updated = await this.model.findOneAndUpdate({ _id: input.id }, input);
      if (util.isNil(updated))
        throw new graphql.GraphQLError(`No ${definition.name} found with ID: ${input.id}`);
      return appendIdAndTransform(definition, await this.model.findById(updated._id));
    }

    @IfApiAllowed(Query(() => OutputType(definition), { name: definition.name.toLowerCase() }))
    async getOne(@Args('id', { type: () => graphql.GraphQLID }) id: string): Promise<T> {
      const result = await this.model.findById(id);
      if (util.isNil(result)) throw new graphql.GraphQLError(`No ${definition.name} found with ID: ${id}`);
      return appendIdAndTransform(definition, result) as any;
    }

    @IfApiAllowed(Query(() => [OutputType(definition)], { name: `all${util.plural(definition.name)}` }))
    async getAll(): Promise<T[]> {
      const items = await this.model.find({});
      return items.map((item) => appendIdAndTransform(definition, item)) as any;
    }

    @IfApiAllowed(Mutation(() => SuccessResponse, { name: `remove${definition.name}` }))
    async remove(@Args('id', { type: () => graphql.GraphQLID }) id: string) {
      const removed = await this.model.findByIdAndRemove(id);
      if (util.isNil(removed)) throw new graphql.GraphQLError(`No ${definition.name} found with ID: ${id}`);
      return { success: true };
    }

    @IfApiAllowed(
      Query(() => PaginatedOutputType(definition), { name: `paginate${util.plural(definition.name)}` }),
    )
    async paginate(
      @Args('page', { type: () => graphql.GraphQLInt, defaultValue: 1 }) page: number,
      @Args('limit', { type: () => graphql.GraphQLInt, defaultValue: 10 }) limit: number,
    ) {
      const response = await this.model.paginate({}, { page, limit });
      return plainToInstance(PaginatedOutputType(definition), {
        ...response,
        docs: response.docs.map((doc) => appendIdAndTransform(definition, doc)),
      });
    }
  }

  return GeneratedResolver as any;
}
