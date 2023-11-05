import * as graphql from 'graphql';
import { Inject, Injectable, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { FilterQuery, PaginateModel } from 'mongoose';
import { plainToInstance } from 'class-transformer';

import { Definition } from './definition';
import { inspect } from './inspect';
import { appendIdAndTransform } from './resolvers/shared';
import { SuccessResponse } from './types';
import { MongoHelper } from './mongo-helper';
import { PaginatedOutputType } from './type-functions';
import * as util from './util';
import { Hook } from './hook';
import { MetaKey, Metadata } from './metadata';

export abstract class BaseService<T = any, Context = any> {
  protected model: PaginateModel<any>;
  protected moduleRef: ModuleRef;
  protected definition: Definition;

  protected abstract getHooks(method: keyof Hook): Hook[];

  public async create(ctx: Context, input: Partial<T>): Promise<T> {
    for (const hook of this.getHooks('beforeCreate')) {
      await hook.beforeCreate!({ ctx, input });
    }
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
    for (const property of inspect(this.definition).hasOneProperties) {
      if (!input[property.name]) continue;
      const relation = property.getHasOne();
      const relationDefinition = relation.typeFunction();
      const relationModel = this.moduleRef.get(getModelToken(relationDefinition.name), { strict: false });
      await relationModel.create({
        ...input[property.name],
        [relation.options.to]: created._id,
      });
    }

    for (const property of inspect(this.definition).hasManyProperties) {
      if (!input[property.name] || input[property.name].length === 0) continue;
      const relation = property.getHasMany();
      const relationDefinition = relation.typeFunction();
      for (const subObject of input[property.name]) {
        const relationModel = this.moduleRef.get(getModelToken(relationDefinition.name), { strict: false });
        await relationModel.create({
          ...subObject,
          [relation.options.from]: created._id,
        });
      }
    }
    const result = await this.model.findById(created._id);
    for (const hook of this.getHooks('afterCreate')) {
      await hook.afterCreate!({ ctx, input, created: result });
    }

    return appendIdAndTransform(this.definition, result) as any;
  }

  public async update(ctx: Context, input: Partial<T> & { id: string }): Promise<T> {
    const beforeUpdated = await this.findOne(ctx, { _id: input.id });
    for (const hook of this.getHooks('beforeUpdate')) {
      await hook.beforeUpdate!({ ctx, input, beforeUpdated });
    }
    const updated = await this.model.findOneAndUpdate({ _id: input.id }, input);
    for (const hook of this.getHooks('afterUpdate')) {
      await hook.afterUpdate!({ ctx, input, updated, beforeUpdated });
    }

    return appendIdAndTransform(this.definition, await this.model.findById(updated._id)) as any;
  }

  public async findOne(ctx: Context, filter: FilterQuery<any>): Promise<T> {
    for (const hook of this.getHooks('beforeFindOne')) {
      await hook.beforeFindOne!({ ctx, filter });
    }
    const result = await this.model.findOne(filter);
    if (util.isNil(result)) {
      throw new graphql.GraphQLError(`No ${this.definition.name} found with ID: ${filter._id}`);
    }
    for (const hook of this.getHooks('afterFindOne')) {
      await hook.afterFindOne!({ ctx, result });
    }
    return result;
  }

  public async findAll(filter: Partial<any>, sort: Partial<any>): Promise<T> {
    const mongoFilter = MongoHelper.toQuery(filter);
    const items = await this.model.find(mongoFilter).sort(sort);
    return items.map((item) => appendIdAndTransform(this.definition, item)) as any;
  }

  public async remove(ctx: Context, id: Partial<string>): Promise<SuccessResponse> {
    const beforeRemoved = await this.findOne(ctx, { _id: id });
    for (const hook of this.getHooks('beforeRemove')) {
      await hook.beforeRemove!({ ctx, beforeRemoved });
    }
    const removed = await this.model.findByIdAndRemove(id);
    for (const hook of this.getHooks('afterRemove')) {
      await hook.afterRemove!({ ctx, removed });
    }
    return { success: true };
  }

  public async paginate(
    ctx: Context,
    filter: Partial<any>,
    sort: Partial<any>,
    page: number,
    limit: number,
  ): Promise<T> {
    const mongoFilter = MongoHelper.toQuery(filter);
    const response = await this.model.paginate(mongoFilter, { page, limit, sort });
    return plainToInstance(PaginatedOutputType(this.definition), {
      ...response,
      docs: response.docs.map((doc) => appendIdAndTransform(this.definition, doc)),
    });
  }
}

export function createBaseService(definition: Definition, hooks: Provider[]): typeof BaseService {
  @Injectable()
  class GeneratedBaseService extends BaseService<any, any> {
    constructor(
      @InjectModel(definition.name) public model: PaginateModel<any>,
      public moduleRef: ModuleRef,
    ) {
      super();
      this.definition = definition;
    }

    private getHooksUncached(method: keyof Hook): Hook[] {
      return hooks
        .filter((hook) => {
          if (Metadata.for(hook).get(MetaKey.Hook)() !== definition) return false;
          const hookInstance = this.moduleRef.get(hook as any, { strict: false });
          return util.isFunction(hookInstance[method]);
        })
        .map((hook) => this.moduleRef.get(hook as any, { strict: false }) as Hook);
    }

    protected getHooks(method: keyof Hook): Hook[] {
      return util.memoize(this.getHooksUncached.bind(this))(method);
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
