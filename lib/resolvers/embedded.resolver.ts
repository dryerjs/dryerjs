import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import * as util from '../util';
import { SuccessResponse } from '../types';
import { MetaKey, Metadata } from '../metadata';
import { CreateInputType, OutputType, UpdateInputType } from '../type-functions';
import { Definition } from '../definition';
import { ArrayValidationPipe } from './shared';
import { EmbeddedConfig } from '../property';
import { ContextDecorator } from '../context';

export function createResolverForEmbedded(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const { typeFunction, options } = Metadata.for(definition)
    .with(field)
    .get<EmbeddedConfig>(MetaKey.EmbeddedType);

  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (options.allowApis.includes(propertyKey as any)) {
        decorator(target, propertyKey, descriptor);
      }
      return descriptor;
    };
  }

  const embeddedDefinition = typeFunction();
  @Resolver()
  class GeneratedResolverForEmbedded<T> {
    constructor(@InjectModel(definition.name) public model: Model<any>) {}

    @IfApiAllowed(
      Mutation(() => [OutputType(embeddedDefinition)], {
        name: `create${util.toPascalCase(definition.name)}${util.toPascalCase(util.plural(field))}`,
      }),
    )
    async create(
      @Args(
        'inputs',
        { type: () => [CreateInputType(embeddedDefinition)] },
        ArrayValidationPipe(CreateInputType(embeddedDefinition)),
      )
      inputs: any[],
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
      @contextDecorator() ctx: any,
    ) {
      ctx;
      const parent = await this.model.findById(parentId).select(field);
      const beforeIds = parent[field].map((item: any) => item._id.toString());
      parent[field].push(...inputs);
      await parent.save();
      const updatedParent = await this.model.findById(parentId).select(field);
      return updatedParent[field].filter((item: any) => beforeIds.indexOf(item._id.toString()) === -1);
    }

    @IfApiAllowed(
      Mutation(() => SuccessResponse, {
        name: `remove${util.toPascalCase(definition.name)}${util.toPascalCase(field)}`,
      }),
    )
    async remove(
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
      @Args('ids', { type: () => [graphql.GraphQLID] })
      ids: string[],
      @contextDecorator() ctx: any,
    ) {
      ctx;
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

    @IfApiAllowed(
      Query(() => OutputType(embeddedDefinition), {
        name: `${util.toCamelCase(definition.name)}${util.toPascalCase(util.singular(field))}`,
      }),
    )
    async findOne(
      @Args('id', { type: () => graphql.GraphQLID }) id: string,
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
      @contextDecorator() ctx: any,
    ): Promise<T> {
      ctx;
      const parent = await this.model.findById(parentId).select(field);
      return parent[field].find((item: any) => item._id.toString() === id);
    }

    @IfApiAllowed(
      Query(() => [OutputType(embeddedDefinition)], {
        name: `${util.toCamelCase(definition.name)}${util.toPascalCase(field)}`,
      }),
    )
    async findAll(
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
      @contextDecorator() ctx: any,
    ): Promise<T[]> {
      ctx;
      const parent = await this.model.findById(parentId).select(field);
      return parent[field];
    }

    @IfApiAllowed(
      Mutation(() => [OutputType(embeddedDefinition)], {
        name: `update${util.toPascalCase(definition.name)}${util.toPascalCase(field)}`,
      }),
    )
    async update(
      @Args(
        'inputs',
        { type: () => [UpdateInputType(embeddedDefinition)] },
        ArrayValidationPipe(UpdateInputType(embeddedDefinition)),
      )
      inputs: any[],
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => graphql.GraphQLID,
      })
      parentId: string,
      @contextDecorator() ctx: any,
    ): Promise<T[]> {
      ctx;
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
      return updatedParent[field].filter((item: any) =>
        inputs.some((input) => input.id === item.id.toString()),
      );
    }
  }

  return GeneratedResolverForEmbedded;
}
