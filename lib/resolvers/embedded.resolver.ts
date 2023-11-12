import * as graphql from 'graphql';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Provider } from '@nestjs/common';

import * as util from '../util';
import { SuccessResponse } from '../types';
import { MetaKey, Metadata } from '../metadata';
import { CreateInputType, OutputType, UpdateInputType } from '../type-functions';
import { Definition } from '../definition';
import { ArrayValidationPipe } from './shared';
import { EmbeddedConfig } from '../property';
import { ContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';
import { GraphQLObjectId, ObjectId, ObjectIdLike } from '../shared';

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
    constructor(@InjectBaseService(definition) public baseService: BaseService) {}

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
        type: () => GraphQLObjectId,
      })
      parentId: ObjectId,
      @contextDecorator() ctx: any,
    ) {
      const parent = await this.baseService.findOne(ctx, { _id: parentId });
      const beforeIds = parent[field].map((item: any) => item._id.toString());
      parent[field].push(...inputs);
      const updated = await this.baseService.update(ctx, { id: parentId, [field]: parent[field] });
      return updated[field].filter((item: any) => beforeIds.indexOf(item._id.toString()) === -1);
    }

    @IfApiAllowed(
      Mutation(() => SuccessResponse, {
        name: `remove${util.toPascalCase(definition.name)}${util.toPascalCase(field)}`,
      }),
    )
    async remove(
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => GraphQLObjectId,
      })
      parentId: ObjectId,
      @Args('ids', { type: () => [GraphQLObjectId] })
      ids: string[],
      @contextDecorator() ctx: any,
    ) {
      const parent = await this.baseService.findOne(ctx, { _id: parentId });
      if (ids.length === 0) {
        throw new graphql.GraphQLError(`No ${util.toCamelCase(embeddedDefinition.name)} IDs provided`);
      }
      parent[field] = parent[field].filter((item: any) => !ids.includes(item._id.toString()));
      await this.baseService.update(ctx, { id: parentId, [field]: parent[field] });
      return { success: true };
    }

    @IfApiAllowed(
      Query(() => OutputType(embeddedDefinition), {
        name: `${util.toCamelCase(definition.name)}${util.toPascalCase(util.singular(field))}`,
      }),
    )
    async findOne(
      @Args('id', { type: () => GraphQLObjectId }) id: ObjectIdLike,
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => GraphQLObjectId,
      })
      parentId: ObjectIdLike,
      @contextDecorator() ctx: any,
    ): Promise<T> {
      const parent = await this.baseService.findOne(ctx, { _id: parentId });
      return parent[field].find((item: any) => item._id.toString() === id.toString());
    }

    @IfApiAllowed(
      Query(() => [OutputType(embeddedDefinition)], {
        name: `${util.toCamelCase(definition.name)}${util.toPascalCase(field)}`,
      }),
    )
    async findAll(
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => GraphQLObjectId,
      })
      parentId: string,
      @contextDecorator() ctx: any,
    ): Promise<T[]> {
      const parent = await this.baseService.findOne(ctx, { _id: parentId });
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
        type: () => GraphQLObjectId,
      })
      parentId: ObjectId,
      @contextDecorator() ctx: any,
    ): Promise<T[]> {
      const parent = await this.baseService.findOne(ctx, { _id: parentId });
      for (const subDocumentInput of inputs) {
        if (!parent[field].find((item: any) => item._id.toString() === subDocumentInput.id.toString())) {
          throw new graphql.GraphQLError(
            `No ${util.toCamelCase(embeddedDefinition.name)} found with ID ${subDocumentInput.id.toString()}`,
          );
        }
      }
      parent[field] = inputs;
      const updatedParent = await this.baseService.update(ctx, { id: parentId, [field]: parent[field] });
      return updatedParent[field].filter((item: any) =>
        inputs.some((input) => input.id.toString() === item.id.toString()),
      );
    }
  }

  return GeneratedResolverForEmbedded;
}
