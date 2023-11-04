import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import { appendIdAndTransform } from './shared';
import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasManyConfig } from '../property';

export function createResolverForHasMany(definition: Definition, field: string): Provider {
  const relation = Metadata.for(definition).with(field).get<HasManyConfig>(MetaKey.HasManyType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasMany<T> {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    @ResolveField()
    async [field](@Parent() parent: any): Promise<T[]> {
      const items = await this.model.find({
        [relation.options.from]: parent.id,
      });
      return items.map((item) => appendIdAndTransform(relationDefinition, item) as any);
    }
  }

  return GeneratedResolverForHasMany;
}
