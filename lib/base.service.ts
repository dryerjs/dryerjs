import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { Definition } from './definition';
import { inspect } from './inspect';
import { appendIdAndTransform } from './resolvers/shared';

export class BaseService<T = any, Context = any> {
  protected model: PaginateModel<any>;
  protected moduleRef: ModuleRef;
  protected definition: Definition;

  public async create(ctx: Context, input: Partial<T>): Promise<T> {
    const created = await this.model.create(input);
    for (const property of inspect(this.definition).referencesManyProperties) {
      if (!input[property.name] || input[property.name].length === 0) continue;
      const relation = property.getReferencesMany();
      const relationDefinition = relation.typeFunction();
      const newIds: string[] = [];
      for (const subObject of input[property.name]) {
        const relationModel = this.moduleRef.get(getModelToken(relationDefinition.name), { strict: false });
        const createdRelation = await relationModel.create(subObject);
        newIds.push(createdRelation._id);
      }
      await this.model.findByIdAndUpdate(created._id, {
        $addToSet: { [relation.options.from]: { $each: newIds } },
      });
    }
    return appendIdAndTransform(this.definition, await this.model.findById(created._id)) as any;
  }
}

export function createBaseService(definition: Definition): typeof BaseService {
  @Injectable()
  class GeneratedBaseService extends BaseService<any, any> {
    constructor(
      @InjectModel(definition.name) public model: PaginateModel<any>,
      public moduleRef: ModuleRef,
    ) {
      super();
      this.definition = definition;
    }
  }
  return GeneratedBaseService as any;
}

export function InjectBaseService(definition: Definition) {
  return Inject(getBaseServiceToken(definition));
}

export function getBaseServiceToken(definition: Definition) {
  return `Base${definition.name}Service`;
}
