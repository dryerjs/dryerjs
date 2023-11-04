import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as DataLoader from 'dataloader';
import { Definition } from '../definition';
import { MetaKey, Metadata } from '../metadata';
import { HasOneConfig } from '../property';

export type HasOneDataKeys = string[];

export function createHasOneLoader(definition: Definition, field: string): any {
  const relation = Metadata.for(definition).with(field).get<HasOneConfig>(MetaKey.HasOneType);
  const relationDefinition = relation.typeFunction();

  @Injectable()
  class HasOneLoader {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    loader = new DataLoader(async (keys: any) => {
      return await this.getReferences(keys as HasOneDataKeys);
    });

    public async load(key: any) {
      return await this.loader.load(key);
    }

    public async getReferences(dataKeys: HasOneDataKeys) {
      const field = relation.options.to;
      const results = await this.model.find({ [field]: { $in: dataKeys } });

      const items: any[] = [];
      dataKeys.map((dataKey) => {
        items.push(results.find((res) => res[field].toString() === dataKey));
      });

      return items;
    }
  }

  return HasOneLoader;
}
