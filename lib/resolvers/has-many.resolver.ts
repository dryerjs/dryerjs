import * as DataLoader from 'dataloader';
import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { HasManyConfig } from '../property';
import { ContextDecorator } from '../context';
import { ObjectId } from '../shared';

export function createResolverForHasMany(
  definition: Definition,
  field: string,
  contextDecorator: ContextDecorator,
): Provider {
  const relation = Metadata.for(definition).with(field).get<HasManyConfig>(MetaKey.HasManyType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForHasMany<T> {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    @ResolveField()
    async [field](@Parent() parent: any, @contextDecorator() ctx: any): Promise<T[]> {
      ctx;
      const loader = new DataLoader<ObjectId, any>(async (keys) => {
        const field = relation.options.to;
        const items = await this.model.find({ [field]: { $in: keys } });
        return keys.map((id: ObjectId) => {
          return items.filter((item) => item[field].toString() === id.toString());
        });
      });
      return await loader.load(parent._id);
    }
  }

  return GeneratedResolverForHasMany;
}
