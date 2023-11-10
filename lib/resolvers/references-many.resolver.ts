import * as DataLoader from 'dataloader';
import { Model } from 'mongoose';
import { Provider } from '@nestjs/common';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { ReferencesManyConfig } from '../property';
import { ContextDecorator } from '../context';
import { ObjectId } from '../shared';

export function createResolverForReferencesMany(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<ReferencesManyConfig>(MetaKey.ReferencesManyType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForReferencesMany<T> {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    @ResolveField()
    async [field](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T[]> {
      ctx;
      const loader = new DataLoader<ObjectId[], any>(async (keys) => {
        const flattenKeys: ObjectId[] = keys.flat();
        const field = relation.options.to || '_id';
        const items = await this.model.find({ [field]: { $in: flattenKeys } });
        return keys.map((ids: ObjectId[]) => {
          return items.filter((item) => ids.some((id) => id.toString() === item._id.toString()));
        });
      });
      return await loader.load(parent[relation.options.from]);
    }
  }

  return GeneratedResolverForReferencesMany;
}
