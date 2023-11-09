import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasManyConfig } from '../property';
import { ModuleRef } from '@nestjs/core';

export function createResolverForHasMany(definition: Definition, field: string): Provider {
  const relation = Metadata.for(definition).with(field).get<HasManyConfig>(MetaKey.HasManyType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasMany<T> {
    constructor(
      @InjectModel(relationDefinition.name) public model: Model<any>,
      private moduleRef: ModuleRef,
    ) {}

    @ResolveField()
    async [field](@Parent() parent: any): Promise<T[]> {
      const dataloader = await this.moduleRef.resolve(`${definition.name}HasManyLoader`);
      return await dataloader.load(parent.id);
    }
  }

  return GeneratedResolverForHasMany;
}
