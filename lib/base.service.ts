import * as graphql from 'graphql';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import { plainToInstance } from 'class-transformer';

import { Definition } from './definition';
import { inspect } from './inspect';
import { appendIdAndTransform } from './resolvers/shared';
import { SuccessResponse } from './types';
import { MongoHelper } from './mongo-helper';
import { PaginatedOutputType } from './type-functions';
import * as util from './util';

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

  public async update(ctx: Context, input: Partial<T> & { id: string }): Promise<T> {
    const updated = await this.model.findOneAndUpdate({ _id: input.id }, input);
    if (util.isNil(updated))
      throw new graphql.GraphQLError(`No ${this.definition.name} found with ID: ${input.id}`);
    return appendIdAndTransform(this.definition, await this.model.findById(updated._id)) as any;
  }

  public async getOne(ctx: Context, id: Partial<string>): Promise<T> {
    const result = await this.model.findById(id);
    if (util.isNil(result)) throw new graphql.GraphQLError(`No ${this.definition.name} found with ID: ${id}`);
    return appendIdAndTransform(this.definition, result) as any;
  }

  public async getAll(): Promise<T> {
    const items = await this.model.find({});
    return items.map((item) => appendIdAndTransform(this.definition, item)) as any;
  }

  public async remove(ctx: Context, id: Partial<string>): Promise<SuccessResponse> {
    const removed = await this.model.findByIdAndRemove(id);
    if (util.isNil(removed))
      throw new graphql.GraphQLError(`No ${this.definition.name} found with ID: ${id}`);
    return { success: true };
  }

  public async paginate(ctx: Context, filter: Partial<any>, page: number, limit: number): Promise<T> {
    const mongoFilter = MongoHelper.toQuery(filter);
    const response = await this.model.paginate(mongoFilter, { page, limit });
    return plainToInstance(PaginatedOutputType(this.definition), {
      ...response,
      docs: response.docs.map((doc) => appendIdAndTransform(this.definition, doc)),
    });
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
