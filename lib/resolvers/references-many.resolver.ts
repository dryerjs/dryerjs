import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { appendIdAndTransform } from './shared';
import { Typer } from '../typer';
import { referencesManyCache } from '../property';
import { Definition } from '../shared';
import { Provider } from '@nestjs/common';

export function createResolverForReferencesMany(
  definition: Definition,
  field: string,
): Provider {
  const relation = referencesManyCache[definition.name][field];
  const relationDefinition = relation.fn();

  @Resolver(() => Typer.getObjectType(definition))
  class GeneratedResolverForReferencesMany<T> {
    constructor(
      @InjectModel(relationDefinition.name) public model: Model<any>,
    ) {}

    @ResolveField()
    async [field](@Parent() parent: any): Promise<T[]> {
      const items = await this.model.find({
        [relation.to || '_id']: { $in: parent[relation.from] },
      });
      return items.map((item) =>
        appendIdAndTransform(relationDefinition, item),
      ) as any;
    }
  }

  return GeneratedResolverForReferencesMany;
}
