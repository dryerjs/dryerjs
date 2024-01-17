import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { BadRequestException, NotFoundException, Provider } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import * as util from '../util';
import { SuccessResponse } from '../types';
import { MetaKey, Metadata } from '../metadata';
import { CreateInputType, OutputType, UpdateInputType } from '../type-functions';
import { Definition } from '../definition';
import { ArrayValidationPipe, applyDecorators } from './shared';
import { EmbeddedConfig } from '../relations';
import { ContextDecorator } from '../context';
import { BaseService, InjectBaseService } from '../base.service';
import { GraphQLObjectId, ObjectIdLike } from '../shared';
import { EmbeddedResolverConfig } from '../module-options';

export function createResolverForEmbedded(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
  embeddedResolverConfig: EmbeddedResolverConfig | undefined,
): Provider {
  const { typeFunction } = Metadata.for(definition).with(field).get<EmbeddedConfig>(MetaKey.EmbeddedType);

  function IfApiAllowed(decorator: MethodDecorator) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if ((embeddedResolverConfig?.allowedApis ?? [])!.includes(propertyKey as any)) {
        decorator(target, propertyKey, descriptor);
      }
      return descriptor;
    };
  }

  const embeddedDefinition = typeFunction();
  const resolverDecorators = embeddedResolverConfig?.decorators ?? {};
  @Resolver()
  class GeneratedResolverForEmbedded<T> {
    constructor(@InjectBaseService(definition) public baseService: BaseService) {}

    @applyDecorators(
      util.defaultToChain(
        util.defaultToChain(resolverDecorators.create, resolverDecorators.write, resolverDecorators.default),
      ),
    )
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
      parentId: ObjectIdLike,
      @contextDecorator() ctx: any,
    ) {
      const parent = await this.baseService.findById(ctx, { _id: parentId });
      const beforeIds = parent[field].map((item: any) => item._id.toString());
      parent[field].push(...inputs);
      const updated = await this.baseService.update(ctx, { id: parentId, [field]: parent[field] });
      return updated[field]
        .filter((item: any) => beforeIds.indexOf(item._id.toString()) === -1)
        .map((item: any) => plainToInstance(OutputType(embeddedDefinition), item.toObject()));
    }

    @applyDecorators(
      util.defaultToChain(
        util.defaultToChain(resolverDecorators.remove, resolverDecorators.write, resolverDecorators.default),
      ),
    )
    @IfApiAllowed(
      Mutation(() => SuccessResponse, {
        name: `remove${util.toPascalCase(definition.name)}${util.toPascalCase(field)}`,
      }),
    )
    async remove(
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => GraphQLObjectId,
      })
      parentId: ObjectIdLike,
      @Args('ids', { type: () => [GraphQLObjectId] })
      ids: string[],
      @contextDecorator() ctx: any,
    ) {
      const parent = await this.baseService.findById(ctx, { _id: parentId });
      if (ids.length === 0) {
        throw new BadRequestException(`No ${embeddedDefinition.name} IDs provided`);
      }
      const stringifiedIds = ids.map((id) => id.toString());
      parent[field] = parent[field].filter((item) => !stringifiedIds.includes(item._id.toString()));
      await this.baseService.update(ctx, { id: parentId, [field]: parent[field] });
      return { success: true };
    }

    @applyDecorators(
      util.defaultToChain(
        util.defaultToChain(resolverDecorators.findOne, resolverDecorators.read, resolverDecorators.default),
      ),
    )
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
      const parent = await this.baseService.findById(ctx, { _id: parentId });
      const result = parent[field].find((item: any) => item._id.toString() === id.toString());
      if (util.isNil(result)) {
        throw new NotFoundException(`No ${embeddedDefinition.name} found with ID ${id.toString()}`);
      }
      return plainToInstance(OutputType(embeddedDefinition), result.toObject());
    }

    @applyDecorators(
      util.defaultToChain(
        util.defaultToChain(resolverDecorators.findAll, resolverDecorators.read, resolverDecorators.default),
      ),
    )
    @IfApiAllowed(
      Query(() => [OutputType(embeddedDefinition)], {
        name: `${util.toCamelCase(definition.name)}${util.toPascalCase(field)}`,
      }),
    )
    async findAll(
      @Args(`${util.toCamelCase(definition.name)}Id`, {
        type: () => GraphQLObjectId,
      })
      parentId: ObjectIdLike,
      @contextDecorator() ctx: any,
    ): Promise<T[]> {
      const parent = await this.baseService.findById(ctx, { _id: parentId });
      return parent[field].map((item: any) =>
        plainToInstance(OutputType(embeddedDefinition), item.toObject()),
      );
    }

    @applyDecorators(
      util.defaultToChain(
        util.defaultToChain(resolverDecorators.update, resolverDecorators.write, resolverDecorators.default),
      ),
    )
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
      parentId: ObjectIdLike,
      @contextDecorator() ctx: any,
    ): Promise<T[]> {
      const parent = await this.baseService.findById(ctx, { _id: parentId });
      for (const subDocumentInput of inputs) {
        const exists = parent[field].some(
          (item: any) => item._id.toString() === subDocumentInput.id.toString(),
        );
        if (!exists) {
          throw new NotFoundException(
            `No ${embeddedDefinition.name} found with ID ${subDocumentInput.id.toString()}`,
          );
        }
      }

      const parentFieldAfter = parent[field].map((item) => {
        const input = inputs.find((input) => input.id.toString() === item._id.toString());
        if (!input) return item;

        return {
          ...item.toObject(),
          ...input,
        };
      });

      const updatedParent = await this.baseService.update(ctx, { id: parentId, [field]: parentFieldAfter });
      return updatedParent[field]
        .filter((item: any) => inputs.some((input) => input.id.toString() === item.id.toString()))
        .map((item: any) => plainToInstance(OutputType(embeddedDefinition), item.toObject()));
    }
  }

  return GeneratedResolverForEmbedded;
}
