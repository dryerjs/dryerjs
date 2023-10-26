import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import { appendIdAndTransform } from './shared';
import { Definition } from '../shared';
import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';

export function createResolverForReferencesMany(definition: Definition, field: string): Provider {
  const relation = Metadata.for(definition).with(field).get(MetaKey.ReferencesManyType);
  const relationDefinition = relation.fn();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForReferencesMany<T> {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    @ResolveField()
    async [field](@Parent() parent: any): Promise<T[]> {
      const items = await this.model.find({
        [relation.options.to || '_id']: { $in: parent[relation.options.from] },
      });
      return items.map((item) => appendIdAndTransform(relationDefinition, item)) as any;
    }
  }

  return GeneratedResolverForReferencesMany;
}
