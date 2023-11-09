import * as graphql from 'graphql';
import { Inject, Injectable, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, PaginateModel } from 'mongoose';
import { Definition } from './definition';
import { inspect } from './inspect';
import { SuccessResponse } from './types';
import * as util from './util';
import { AllDefinitions, Hook } from './hook';
import { MetaKey, Metadata } from './metadata';

export abstract class BaseService<T = any, Context = any> {
  protected model: PaginateModel<T>;
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
        const baseServiceForRelation = this.moduleRef.get(getBaseServiceToken(relationDefinition), {
          strict: false,
        }) as BaseService;
        const createdRelation = await baseServiceForRelation.create(ctx, subObject);
        newIds.push(createdRelation._id);
      }
      await this.model.findByIdAndUpdate(created._id, {
        $addToSet: { [relation.options.from]: { $each: newIds } } as any,
      });
    }
    for (const property of inspect(this.definition).hasOneProperties) {
      if (!input[property.name]) continue;
      const relation = property.getHasOne();
      const relationDefinition = relation.typeFunction();
      const baseServiceForRelation = this.moduleRef.get(getBaseServiceToken(relationDefinition), {
        strict: false,
      }) as BaseService;
      await baseServiceForRelation.create(ctx, {
        ...input[property.name],
        [relation.options.to]: created._id,
      });
    }

    for (const property of inspect(this.definition).hasManyProperties) {
      if (!input[property.name] || input[property.name].length === 0) continue;
      const relation = property.getHasMany();
      const relationDefinition = relation.typeFunction();
      for (const subObject of input[property.name]) {
        const baseServiceForRelation = this.moduleRef.get(getBaseServiceToken(relationDefinition), {
          strict: false,
        }) as BaseService;
        await baseServiceForRelation.create(ctx, {
          ...subObject,
          [relation.options.from]: created._id,
        });
      }
    }
    const result = await this.model.findById(created._id);
    for (const hook of this.getHooks('afterCreate')) {
      await hook.afterCreate!({ ctx, input, created: result });
    }
    console.log(result);
    return result as any;
  }

  public async update(ctx: Context, input: Partial<T> & { id: string }): Promise<T> {
    const beforeUpdated = await this.findOne(ctx, { _id: input.id });
    for (const hook of this.getHooks('beforeUpdate')) {
      await hook.beforeUpdate!({ ctx, input, beforeUpdated });
    }
    const updated = await this.model.findOneAndUpdate({ _id: input.id }, input, { new: true });
    for (const hook of this.getHooks('afterUpdate')) {
      await hook.afterUpdate!({ ctx, input, updated, beforeUpdated });
    }
    return updated!;
  }

  public async findOne(ctx: Context, filter: FilterQuery<T>): Promise<T> {
    for (const hook of this.getHooks('beforeFindOne')) {
      await hook.beforeFindOne!({ ctx, filter });
    }
    const result = await this.model.findOne(filter);
    if (util.isNil(result)) {
      throw new graphql.GraphQLError(`No ${this.definition.name} found with ID: ${filter._id}`);
    }
    for (const hook of this.getHooks('afterFindOne')) {
      await hook.afterFindOne!({ ctx, result, filter });
    }
    return result;
  }

  public async findAll(ctx: Context, filter: FilterQuery<T>, sort: object): Promise<T[]> {
    for (const hook of this.getHooks('beforeFindMany')) {
      await hook.beforeFindMany!({ ctx, filter, sort });
    }
    const items = await this.model.find(filter).sort(sort as any);
    for (const hook of this.getHooks('afterFindMany')) {
      await hook.afterFindMany!({ ctx, filter, sort, items });
    }
    return items;
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

  public async paginate(ctx: Context, filter: FilterQuery<T>, sort: object, page: number, limit: number) {
    for (const hook of this.getHooks('beforeFindMany')) {
      await hook.beforeFindMany!({ ctx, filter, sort, page, limit });
    }
    const response = await this.model.paginate(filter, { page, limit, sort });
    for (const hook of this.getHooks('afterFindMany')) {
      await hook.afterFindMany!({ ctx, filter, sort, items: response.docs, page, limit });
    }

    return response;
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
          const hookDefinition = Metadata.for(hook).get(MetaKey.Hook)();
          if (hookDefinition !== AllDefinitions && hookDefinition !== definition) return false;
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
