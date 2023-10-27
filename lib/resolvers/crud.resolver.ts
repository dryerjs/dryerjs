import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { PaginateModel } from 'mongoose';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Provider, ValidationPipe } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';

import { appendIdAndTransform } from './shared';
import * as util from '../util';
import { ApiType } from '../shared';
import { CreateInputType, OutputType, PaginatedOutputType, UpdateInputType } from '../type-functions';
import { SuccessResponse } from '../types';
import { inspect } from '../inspect';
import { Definition } from '../definition';

export function createResolver(definition: Definition): Provider {
  function IfApiAllowed(decorator: MethodDecorator, apiType: ApiType) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (inspect(definition).isApiAllowed(apiType)) {
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

    @IfApiAllowed(Mutation(() => OutputType(definition)), 'create')
    async [`create${definition.name}`](
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

    @IfApiAllowed(Mutation(() => OutputType(definition)), 'update')
    async [`update${definition.name}`](
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

    @IfApiAllowed(Query(() => OutputType(definition)), 'getOne')
    async [definition.name.toLowerCase()](
      @Args('id', { type: () => graphql.GraphQLID }) id: string,
    ): Promise<T> {
      const result = await this.model.findById(id);
      if (util.isNil(result)) throw new graphql.GraphQLError(`No ${definition.name} found with ID: ${id}`);
      return appendIdAndTransform(definition, result) as any;
    }

    @IfApiAllowed(Query(() => [OutputType(definition)]), 'getAll')
    async [`all${util.plural(definition.name)}`](): Promise<T[]> {
      const items = await this.model.find({});
      return items.map((item) => appendIdAndTransform(definition, item)) as any;
    }

    @IfApiAllowed(Mutation(() => SuccessResponse), 'remove')
    async [`remove${definition.name}`](@Args('id', { type: () => graphql.GraphQLID }) id: string) {
      const removed = await this.model.findByIdAndRemove(id);
      if (util.isNil(removed)) throw new graphql.GraphQLError(`No ${definition.name} found with ID: ${id}`);
      return { success: true };
    }

    @IfApiAllowed(Query(() => PaginatedOutputType(definition)), 'paginate')
    async [`paginate${util.plural(definition.name)}`](
      @Args('page', { type: () => graphql.GraphQLInt, defaultValue: 1 }) page: number,
      @Args('limit', { type: () => graphql.GraphQLInt, defaultValue: 10 }) limit: number,
    ) {
      const { docs, totalDocs, totalPages, page: pageResult, limit: limitResult, hasNextPage, nextPage, hasPrevPage, prevPage, pagingCounter } = await this.model.paginate({}, { page, limit });
      return plainToInstance(PaginatedOutputType(definition), {
        docs: docs.map((doc) => appendIdAndTransform(definition, doc)),
        totalDocs,
        page: pageResult,
        limit: limitResult,
        totalPages,
        hasNextPage,
        nextPage,
        hasPrevPage,
        prevPage,
        pagingCounter,
      });
    }
  }

  return GeneratedResolver as any;
}
