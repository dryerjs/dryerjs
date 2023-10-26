import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { appendIdAndTransform } from './shared';
import { Typer } from '../typer';
import { Definition } from '../shared';
import { Provider } from '@nestjs/common';
import { MetaKey, Metadata } from '../metadata';

export function createResolverForReferencesMany(definition: Definition, field: string): Provider {
  const relation = Metadata.for(definition).with(field).get(MetaKey.ReferencesManyType);
  const relationDefinition = relation.fn();

  @Resolver(() => Typer.for(definition).output)
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
