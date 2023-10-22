import * as graphql from 'graphql';
import {
  Resolver,
  Query,
  Args,
  Mutation,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ModuleRef } from '@nestjs/core';

import * as util from './util';
import { Definition } from './shared';
import { Typer } from './typer';
import { embeddedCached, referencesManyCache } from './property';

const preTransformed = Symbol('preTransformed');

export function createResolver(definition: Definition) {
  @Resolver()
  class GeneratedResolver<T> {
    constructor(
      @InjectModel(definition.name) public model: Model<any>,
      public moduleRef: ModuleRef,
    ) {}

    @Mutation(() => Typer.getObjectType(definition))
    async [`create${definition.name}`](
      @Args(
        'input',
        { type: () => Typer.getInputType(definition) },
        new ValidationPipe({
          transform: true,
          expectedType: Typer.getInputType(definition),
        }),
      )
      input: any,
    ) {
      const created = await this.model.create(input);
      for (const propertyName in referencesManyCache[definition.name] || {}) {
        if (!input[propertyName] || input[propertyName].length === 0) continue;
        const relationDefinition =
          referencesManyCache[definition.name][propertyName]();
        const newIds: string[] = [];
        for (const subObject of input[propertyName]) {
          const relationModel = this.moduleRef.get(
            getModelToken(relationDefinition.name),
            { strict: false },
          );
          const createdRelation = await relationModel.create(subObject);
          newIds.push(createdRelation._id);
        }
        console.log({ newIds });
        await this.model.findByIdAndUpdate(created._id, {
          $addToSet: { tagIds: { $each: newIds } },
        });
      }
      const preTransformed = await this.model.findById(created._id);
      const result = plainToInstance(
        Typer.getObjectType(definition),
        preTransformed.toObject(),
      );
      result[preTransformed] = preTransformed;
      return result;
    }

    @Query(() => Typer.getObjectType(definition))
    async [definition.name.toLowerCase()](
      @Args('id', { type: () => graphql.GraphQLID }) id: string,
    ): Promise<T> {
      const result = await this.model.findById(id);
      return plainToInstance(
        Typer.getObjectType(definition),
        result.toObject(),
      ) as any;
    }

    @Query(() => [Typer.getObjectType(definition)])
    async [`all${util.plural(definition.name)}`](): Promise<T[]> {
      const items = await this.model.find({});
      return items.map((item) => {
        const result = plainToInstance(Typer.getObjectType(definition), {
          id: item._id.toString(),
          ...item.toObject(),
        });
        result[preTransformed] = item;
        return result;
      }) as any;
    }
  }

  return GeneratedResolver;
}

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
      field,
    )}`](
      @Args(
        'input',
        { type: () => Typer.getInputType(embeddedDefinition) },
        new ValidationPipe({
          transform: true,
          expectedType: Typer.getInputType(embeddedDefinition),
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
      return plainToInstance(
        Typer.getObjectType(embeddedDefinition),
        (util.last(updatedParent[field]) as any).toObject(),
      );
    }

    @Query(() => Typer.getObjectType(definition))
    async [`${util.toCamelCase(definition.name)}${util.toPascalCase(field)}`](
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
      return plainToInstance(
        Typer.getObjectType(embeddedDefinition),
        result.toObject(),
      ) as any;
    }
  }

  return GeneratedResolverForEmbedded;
}

export function createResolverForReferencesMany(
  definition: Definition,
  field: string,
) {
  const relationDefinition = referencesManyCache[definition.name][field]();

  @Resolver(() => Typer.getObjectType(definition))
  class GeneratedResolverForReferencesMany<T> {
    constructor(
      @InjectModel(relationDefinition.name) public model: Model<any>,
    ) {}

    @ResolveField(() => [Typer.getObjectType(relationDefinition)])
    async [field](@Parent() parent: any): Promise<T[]> {
      // TODO: remove hardcoded tagIds
      const items = await this.model.find({
        _id: { $in: parent[preTransformed]['tagIds'] },
      });
      return items.map((item) =>
        plainToInstance(
          Typer.getObjectType(relationDefinition),
          item.toObject(),
        ),
      ) as any;
    }
  }

  return GeneratedResolverForReferencesMany;
}
