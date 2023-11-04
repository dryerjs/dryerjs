import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import { appendIdAndTransform } from './shared';
import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasOneConfig } from '../property';
import { ModuleRef } from '@nestjs/core';

export function createResolverForHasOne(definition: Definition, field: string): Provider {
  const relation = Metadata.for(definition).with(field).get<HasOneConfig>(MetaKey.HasOneType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasOne<T> {
    constructor(
      @InjectModel(relationDefinition.name) public model: Model<any>,
      private moduleRef: ModuleRef,
    ) {}

    @ResolveField()
    async [field](@Parent() parent: any): Promise<T> {
      const dataloader = await this.moduleRef.resolve(`${definition.name}HasOneLoader`);
      const item = await dataloader.load(parent.id);
      return appendIdAndTransform(relationDefinition, item) as any;
    }
  }

  return GeneratedResolverForHasOne;
}
