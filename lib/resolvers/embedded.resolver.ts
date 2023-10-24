import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ValidationPipe } from '@nestjs/common';

import * as util from '../util';
import { Definition } from '../shared';
import { Typer } from '../typer';
import { embeddedCached } from '../property';
import { appendIdAndTransform } from './shared';
import { SuccessResponse } from '../types';

export function createResolverForEmbedded(
  definition: Definition,
  field: string,
) {
  const embeddedDefinition = embeddedCached[definition.name][field]();

  @Resolver()
  class GeneratedResolverForEmbedded<T> {
    constructor(@InjectModel(definition.name) public model: Model<any>) {}

    @Mutation(() => Typer.getObjectType(embeddedDefinition))
    async [`create${util.toPascalCase(definition.name)}${util.toPascalCase(
      util.singular(field),
    )}`](
      @Args(
        'input',
        { type: () => Typer.getCreateInputType(embeddedDefinition) },
        new ValidationPipe({
          transform: true,
          expectedType: Typer.getCreateInputType(embeddedDefinition),
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
      return appendIdAndTransform(
        embeddedDefinition,
        util.last(updatedParent[field]) as any,
      );
    }

    @Mutation(() => SuccessResponse)
    async [`remove${util.toPascalCase(definition.name)}${util.toPascalCase(
      field,
    )}`](
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
      @Args(`${util.toCamelCase(embeddedDefinition.name)}Ids`, {
        type: () => [graphql.GraphQLID],
      })
      ids: string[],
    ) {
      const parent = await this.model.findById(parentId);
      if (!parent) {
        throw new Error(
          `No ${util.toCamelCase(definition.name)} found with ID ${parentId}`,
        );
      }

      parent[field] = parent[field].filter(
        (item: any) => !ids.includes(item._id.toString()),
      );
      await parent.save();
      return { success: true };
    }

    @Query(() => Typer.getObjectType(embeddedDefinition))
    async [`${util.toCamelCase(definition.name)}${util.toPascalCase(
      util.singular(field),
    )}`](
      @Args('id', { type: () => graphql.GraphQLID }) id: string,
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
    ): Promise<T> {
      const parent = await this.model.findById(parentId).select(field);
      const result = parent[field].find(
        (item: any) => item._id.toString() === id,
      );
      return appendIdAndTransform(embeddedDefinition, result) as any;
    }
  }

  return GeneratedResolverForEmbedded;
}
