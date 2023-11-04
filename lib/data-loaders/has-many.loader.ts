import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as DataLoader from 'dataloader';
import { Definition } from '../definition';
import { MetaKey, Metadata } from '../metadata';
import { HasManyConfig } from '../property';

export type HasManyDataKeys = string[];

export function createHasManyLoader(definition: Definition, field: string): any {
  const relation = Metadata.for(definition).with(field).get<HasManyConfig>(MetaKey.HasManyType);
  const relationDefinition = relation.typeFunction();

  @Injectable()
  class HasManyLoader {
    constructor(@InjectModel(relationDefinition.name) public model: Model<any>) {}

    loader = new DataLoader(async (keys: any) => {
      return await this.getReferences(keys as HasManyDataKeys);
    });

    public async load(key: any) {
      return await this.loader.load(key);
    }

    public async getReferences(dataKeys: HasManyDataKeys) {
      const field = relation.options.from;
      const results = await this.model.find({ [field]: { $in: dataKeys } });

      const itemMap: any[] = [];

      dataKeys.map((dataKey) => {
        const items: any[] = [];
        results.map((res) => {
          if (res[field].toString() === dataKey) items.push(res);
        });
        itemMap.push(items);
      });

      return itemMap;
    }
  }

  return HasManyLoader;
}
