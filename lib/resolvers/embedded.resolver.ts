import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider, ValidationPipe } from '@nestjs/common';

import * as util from '../util';
import { SuccessResponse } from '../types';
import { MetaKey, Metadata } from '../metadata';
import { CreateInputType, OutputType, UpdateInputType } from '../type-functions';
import { Definition } from '../definition';
import { appendIdAndTransform } from './shared';

export function createResolverForEmbedded(definition: Definition, field: string): Provider {
  const embeddedDefinition = Metadata.for(definition).with(field).get(MetaKey.EmbeddedType)();

  @Resolver()
  class GeneratedResolverForEmbedded<T> {
    constructor(@InjectModel(definition.name) public model: Model<any>) {}

    @Mutation(() => OutputType(embeddedDefinition))
    async [`create${util.toPascalCase(definition.name)}${util.toPascalCase(util.singular(field))}`](
      @Args(
        'input',
        { type: () => CreateInputType(embeddedDefinition) },
        new ValidationPipe({
          transform: true,
          expectedType: CreateInputType(embeddedDefinition),
        }),
      )
      input: any,
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
    ) {
      const parent = await this.model.findById(parentId).select(field);
      parent[field].push(input);
      await parent.save();
      const updatedParent = await this.model.findById(parentId).select(field);
      return appendIdAndTransform(embeddedDefinition, util.last(updatedParent[field]) as any);
    }

    @Mutation(() => SuccessResponse)
    async [`remove${util.toPascalCase(definition.name)}${util.toPascalCase(field)}`](
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
      @Args('ids', { type: () => [graphql.GraphQLID] })
      ids: string[],
    ) {
      const parent = await this.model.findById(parentId);
      if (!parent) {
        throw new graphql.GraphQLError(`No ${util.toCamelCase(definition.name)} found with ID ${parentId}`);
      }

      if (ids.length === 0) {
        throw new graphql.GraphQLError(`No ${util.toCamelCase(embeddedDefinition.name)} IDs provided`);
      }

      parent[field] = parent[field].filter((item: any) => !ids.includes(item._id.toString()));
      await parent.save();
      return { success: true };
    }

    @Query(() => OutputType(embeddedDefinition))
    async [`${util.toCamelCase(definition.name)}${util.toPascalCase(util.singular(field))}`](
      @Args('id', { type: () => graphql.GraphQLID }) id: string,
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
    ): Promise<T> {
      const parent = await this.model.findById(parentId).select(field);
      const result = parent[field].find((item: any) => item._id.toString() === id);
      return appendIdAndTransform(embeddedDefinition, result) as any;
    }

    @Query(() => [OutputType(embeddedDefinition)])
    async [`${util.toCamelCase(definition.name)}${util.toPascalCase(field)}`](
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
    ): Promise<T[]> {
      const parent = await this.model.findById(parentId).select(field);
      return parent[field].map((item: any) => appendIdAndTransform(embeddedDefinition, item)) as any;
    }

    @Mutation(() => [OutputType(embeddedDefinition)])
    async [`update${util.toPascalCase(definition.name)}${util.toPascalCase(field)}`](
      @Args(
        'inputs',
        { type: () => [UpdateInputType(embeddedDefinition)] },
        new ValidationPipe({
          transform: true,
          expectedType: UpdateInputType(embeddedDefinition),
        }),
      )
      inputs: any[],
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
    ): Promise<T[]> {
      const parent = await this.model.findById(parentId);
      if (util.isNil(parent)) {
        throw new graphql.GraphQLError(`No ${util.toCamelCase(definition.name)} found with ID ${parentId}`);
      }

      for (const subDocumentInput of inputs) {
        if (!parent[field].find((item: any) => item._id.toString() === subDocumentInput.id.toString())) {
          throw new graphql.GraphQLError(
            `No ${util.toCamelCase(embeddedDefinition.name)} found with ID ${subDocumentInput.id.toString()}`,
          );
        }
      }
      parent[field] = inputs;
      await parent.save();
      const updatedParent = await this.model.findById(parentId).select(field);
      return updatedParent[field].map((item: any) => appendIdAndTransform(embeddedDefinition, item)) as any;
    }
  }

  return GeneratedResolverForEmbedded;
}
