import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as DataLoader from 'dataloader';
import { Definition } from '../definition';
import { MetaKey, Metadata } from '../metadata';

export type HasManyDataKey = any[];

export function createReferencesManyLoader(definition: Definition, field: string): any {
  const relation = Metadata.for(definition).with(field).get(MetaKey.ReferencesManyType);
  const relationDefinition = relation.typeFunction();

  @Injectable()
  class ReferencesManyLoader {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    loader = new DataLoader(async (keys: any) => {
      return await this.getReferences(keys as HasManyDataKey[]);
    });

    public async load(key: any) {
      return await this.loader.load(key);
    }

    public async getReferences(dataKeys: HasManyDataKey[]) {
      const flattenKeys: any[] = [];
      dataKeys.map((key: any[]) => flattenKeys.push(...key));

      const field = relation.options.to || '_id';
      const results = await this.model.find({ [field]: { $in: flattenKeys } });

      const itemMap: any[] = [];

      dataKeys.map((dataKey) => {
        const items: any[] = [];
        dataKey.map((key) => {
          const item = results.find((res) => (field === '_id' ? res[field].toString() : res[field]) === key);
          if (item) items.push(item);
        });
        itemMap.push(items);
      });

      return itemMap;
    }
  }

  return ReferencesManyLoader;
}
