import { Resolver, Parent, ResolveField } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Provider } from '@nestjs/common';

import { appendIdAndTransform } from './shared';
import { MetaKey, Metadata } from '../metadata';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';
import { BelongToConfig } from '../property';

export function createResolverForBelongTo(definition: Definition, field: string): Provider {
  const relation = Metadata.for(definition).with(field).get<BelongToConfig>(MetaKey.BelongToType);
  const relationDefinition = relation.typeFunction();

  @Resolver(() => OutputType(definition))
  class GeneratedResolverForBelongTo<T> {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    @ResolveField()
    async [field](@Parent() child: any): Promise<T> {
      const item = await this.model.find({
        _id: child[relation.options.from || '_id'],
      });
      return appendIdAndTransform(relationDefinition, item) as any;
    }
  }

  return GeneratedResolverForBelongTo;
}
