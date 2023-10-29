import { ModuleRef } from '@nestjs/core';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import { appendIdAndTransform } from './shared';
import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { ReferencesManyConfig } from '../property';

export function createResolverForReferencesMany(definition: Definition, field: string): Provider {
  const relation = Metadata.for(definition).with(field).get<ReferencesManyConfig>(MetaKey.ReferencesManyType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForReferencesMany<T> {
    constructor(
      @InjectModel(relationDefinition.name) public model: Model<any>,
      private moduleRef: ModuleRef,
    ) {}

    @ResolveField()
    async [field](@Parent() parent: any): Promise<T[]> {
      const dataloader = await this.moduleRef.resolve(`${definition.name}Loader`);
      const items = await dataloader.load(parent[relation.options.from]);
      return items.map((item) => appendIdAndTransform(relationDefinition, item)) as any;
    }
  }

  return GeneratedResolverForReferencesMany;
}
