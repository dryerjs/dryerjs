import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, PaginateModel } from 'mongoose';
import * as DataLoader from 'dataloader';
import { plainToInstance } from 'class-transformer';

import { Definition } from './definition';
import { inspect } from './inspect';
import { SuccessResponse } from './types';
import * as util from './util';
import { AllDefinitions, Hook, hookMethods } from './hook';
import { ObjectId, QueryContext, QueryContextSource, QueryContextSymbol, StringLikeId } from './shared';
import { RemoveMode, RemoveOptions } from './remove-options';
import { OutputType } from './type-functions';

export abstract class BaseService<T = any, Context = any> {
  public model: PaginateModel<T>;
  protected moduleRef: ModuleRef;
  protected definition: Definition;

  protected abstract getHooks: (method: Hook) => util.FunctionLike[];

  public async create(ctx: Context, input: Partial<T>): Promise<T> {
    for (const hook of this.getHooks(Hook.BeforeCreate)) {
      await hook({ ctx, input, definition: this.definition });
    }

    const created = await this.model.create(input);
    for (const property of inspect(this.definition).referencesManyProperties) {
      if (util.isNil(input[property.name]) || input[property.name].length === 0) continue;
      const relation = property.getReferencesMany();
      const relationDefinition = relation.typeFunction();
      const newIds: string[] = [];
      for (const subObject of input[property.name]) {
        const baseServiceForRelation = this.moduleRef.get(getBaseServiceToken(relationDefinition), {
          strict: false,
        });
        const createdRelation = await baseServiceForRelation.create(ctx, subObject);
        newIds.push(createdRelation._id);
      }
      await this.model.findByIdAndUpdate(created._id, {
        $addToSet: { [relation.options.from]: { $each: newIds } } as any,
      });
    }
    for (const property of inspect(this.definition).hasOneProperties) {
      if (util.isNil(input[property.name])) continue;
      const relation = property.getHasOne();
      const relationDefinition = relation.typeFunction();
      const baseServiceForRelation = this.moduleRef.get(getBaseServiceToken(relationDefinition), {
        strict: false,
      });
      await baseServiceForRelation.create(ctx, {
        ...input[property.name],
        [relation.options.to]: created._id,
      });
    }

    for (const property of inspect(this.definition).hasManyProperties) {
      if (util.isNil(input[property.name]) || input[property.name].length === 0) continue;
      const relation = property.getHasMany();
      const relationDefinition = relation.typeFunction();
      for (const subObject of input[property.name]) {
        const baseServiceForRelation = this.moduleRef.get(getBaseServiceToken(relationDefinition), {
          strict: false,
        });
        await baseServiceForRelation.create(ctx, {
          ...subObject,
          [relation.options.to]: created._id,
        });
      }
    }
    const result = await this.model.findById(created._id);
    for (const hook of this.getHooks(Hook.AfterCreate)) {
      await hook({ ctx, input, created: result, definition: this.definition });
    }
    return result as any;
  }

  private assignUnderscoreIdRecursively(input: any, definition: Definition) {
    for (const property of inspect(definition).embeddedProperties) {
      if (util.isNil(input[property.name])) continue;
      if (util.isArray(input[property.name])) {
        for (const subObject of input[property.name]) {
          if (util.isNotNil(subObject.id) && util.isNil(subObject._id)) {
            subObject._id = subObject.id;
          }
          this.assignUnderscoreIdRecursively(subObject, property.getEmbedded().typeFunction());
        }
      }
      if (util.isNotNullObject(input[property.name])) {
        if (util.isNotNil(input[property.name].id) && util.isNil(input[property.name]._id)) {
          input[property.name]._id = input[property.name].id;
        }

        this.assignUnderscoreIdRecursively(input[property.name], property.definition);
      }
    }
  }

  public async update(ctx: Context, input: Partial<T> & { id: ObjectId }, options?: any): Promise<T> {
    this.assignUnderscoreIdRecursively(input, this.definition);
    const filter = { _id: input.id };
    for (const hook of this.getHooks(Hook.BeforeWriteFilter)) {
      await hook({ ctx, filter, definition: this.definition });
    }
    const beforeUpdated = await this.findOneWithoutBeforeReadFilter(ctx, filter);
    for (const hook of this.getHooks(Hook.BeforeUpdate)) {
      await hook({ ctx, input, beforeUpdated, definition: this.definition });
    }

    const normalizedOptions = { new: true, ...util.defaultTo(options, {}) } as { new: true };
    const updated = await this.model.findOneAndUpdate({ _id: input.id }, input, normalizedOptions);
    for (const hook of this.getHooks(Hook.AfterUpdate)) {
      await hook({ ctx, input, updated, beforeUpdated, definition: this.definition });
    }
    return updated!;
  }

  public async findOneWithoutBeforeReadFilter(
    ctx: Context,
    filter: FilterQuery<T>,
    options?: { nullable?: boolean },
  ): Promise<T | null> {
    for (const hook of this.getHooks(Hook.BeforeFindOne)) {
      await hook({ ctx, filter, definition: this.definition });
    }
    const result = await this.model.findOne(filter);
    if (util.isNil(result)) {
      if (options?.nullable) return null;
      const message = filter._id
        ? `No ${this.definition.name} found with ID: ${filter._id}`
        : `No ${this.definition.name} found`;
      throw new NotFoundException(message);
    }
    for (const hook of this.getHooks(Hook.AfterFindOne)) {
      await hook({ ctx, result, filter, definition: this.definition });
    }
    return result;
  }

  public async findById(ctx: Context, filter: { _id: ObjectId }): Promise<T> {
    return await this.findOne(ctx, filter);
  }

  public async findOne(ctx: Context, filter: FilterQuery<T>): Promise<T> {
    for (const hook of this.getHooks(Hook.BeforeReadFilter)) {
      await hook({ ctx, filter, definition: this.definition });
    }
    return (await this.findOneWithoutBeforeReadFilter(ctx, filter))!;
  }

  public async findByIdNullable(ctx: Context, filter: { _id: ObjectId }): Promise<T | null> {
    return await this.findOneNullable(ctx, filter);
  }

  public async findOneNullable(ctx: Context, filter: FilterQuery<T>): Promise<T | null> {
    for (const hook of this.getHooks(Hook.BeforeReadFilter)) {
      await hook({ ctx, filter, definition: this.definition });
    }
    return await this.findOneWithoutBeforeReadFilter(ctx, filter, { nullable: true });
  }

  public async findAll(ctx: Context, filter: FilterQuery<T>, sort: object): Promise<T[]> {
    for (const hook of this.getHooks(Hook.BeforeReadFilter)) {
      await hook({ ctx, filter, definition: this.definition });
    }
    for (const hook of this.getHooks(Hook.BeforeFindMany)) {
      await hook({ ctx, filter, sort, definition: this.definition });
    }
    const items = await this.model.find(filter).sort(sort as any);
    for (const hook of this.getHooks(Hook.AfterFindMany)) {
      await hook({ ctx, filter, sort, items, definition: this.definition });
    }
    return items;
  }

  public async remove(
    ctx: Context,
    id: ObjectId,
    options: RemoveOptions = { mode: RemoveMode.RequiredCleanRelations },
  ): Promise<SuccessResponse> {
    const filter = { _id: id };
    for (const hook of this.getHooks(Hook.BeforeWriteFilter)) {
      await hook({ ctx, filter, definition: this.definition });
    }
    const beforeRemoved = await this.findOneWithoutBeforeReadFilter(ctx, filter);
    for (const hook of this.getHooks(Hook.BeforeRemove)) {
      await hook({ ctx, beforeRemoved, definition: this.definition, options });
    }
    const removed = await this.model.findByIdAndDelete(id);
    for (const hook of this.getHooks(Hook.AfterRemove)) {
      await hook({ ctx, removed, definition: this.definition, options });
    }
    return { success: true };
  }

  public async paginate(ctx: Context, filter: FilterQuery<T>, sort: object, page: number, limit: number) {
    for (const hook of this.getHooks(Hook.BeforeReadFilter)) {
      await hook({ ctx, filter, definition: this.definition });
    }
    for (const hook of this.getHooks(Hook.BeforeFindMany)) {
      await hook({ ctx, filter, sort, page, limit, definition: this.definition });
    }
    const response = await this.model.paginate(filter, { page, limit, sort });
    for (const hook of this.getHooks(Hook.AfterFindMany)) {
      await hook({
        ctx,
        filter,
        sort,
        items: response.docs,
        page,
        limit,
        definition: this.definition,
      });
    }

    return response;
  }

  public getIdLoader(
    ctx: Context,
    req: any,
    options: {
      parent?: any;
      parentDefinition?: any;
      source?: QueryContextSource;
      transform?: boolean;
    },
  ): DataLoader<StringLikeId, T | undefined> {
    const loaderKey = `loader_for_definition_${this.definition.name}`;
    if (req[loaderKey]) return req[loaderKey];
    const loader = new DataLoader<StringLikeId, T | undefined>(async (keys) => {
      const filter = {
        _id: { $in: keys },
        [QueryContextSymbol]: {
          parent: options.parent,
          parentDefinition: options.parentDefinition,
          source: options.source,
        } as QueryContext,
      };
      const items = await this.findAll(ctx, filter, {});
      const transformedItems = (() => {
        /* istanbul ignore if */
        if (!options.transform) return items;
        return items.map((item) => plainToInstance(OutputType(this.definition), item['toObject']()));
      })();

      return keys.map((id: StringLikeId) => {
        return transformedItems.find((item) => item['_id'].toString() === id.toString());
      });
    });
    req[loaderKey] = loader;
    return req[loaderKey];
  }

  public getFieldLoader(
    ctx: Context,
    field: string,
    req: any,
    options: {
      parent?: any;
      parentDefinition?: any;
      source?: QueryContextSource;
      transform?: boolean;
    },
  ): DataLoader<StringLikeId, [T]> {
    const loaderKey = `loader_for_definition_${this.definition.name}_on_${field}`;
    if (req[loaderKey]) return req[loaderKey];
    const loader = new DataLoader<StringLikeId, T[]>(async (keys) => {
      const filter = {
        [field]: { $in: keys },
        [QueryContextSymbol]: {
          parent: options.parent,
          parentDefinition: options.parentDefinition,
          source: options.source,
        } as QueryContext,
      };
      const items = await this.findAll(ctx, filter, {});
      const transformedItems = (() => {
        /* istanbul ignore if */
        if (!options.transform) return items;
        return items.map((item) => plainToInstance(OutputType(this.definition), item['toObject']()));
      })();

      return keys.map((id) => {
        return transformedItems.filter((item) => String(item[field]) === String(id));
      });
    });
    req[loaderKey] = loader;
    return req[loaderKey];
  }
}

export function createBaseService(definition: Definition): typeof BaseService {
  @Injectable()
  class GeneratedBaseService extends BaseService<any, any> {
    protected getHooks: (method: Hook) => util.FunctionLike[];

    constructor(
      @InjectModel(definition.name) public model: PaginateModel<any>,
      public moduleRef: ModuleRef,
    ) {
      super();
      this.definition = definition;
      this.getHooks = util.memoize(this.getHooksUncached.bind(this));
    }

    private getHooksUncached(hook: Hook): util.FunctionLike[] {
      return hookMethods
        .filter((hookMethod) => {
          if (hookMethod.hook !== hook) return false;
          return (
            hookMethod.typeFunc() === AllDefinitions ||
            hookMethod.typeFunc() === definition ||
            hookMethod.typeFunc().includes?.(definition)
          );
        })
        .sort((hook1, hook2) => (hook1?.options?.priority || 100) - (hook2?.options?.priority || 100))
        .map(({ target, method: methodName }) => {
          const service = this.moduleRef.get(target.constructor, { strict: false });
          return service[methodName].bind(service);
        })
        .filter((hook) => util.isFunction(hook));
    }
  }

  return GeneratedBaseService as any;
}

export function InjectBaseService(definition: Definition | { name: string }) {
  return Inject(getBaseServiceToken(definition));
}

export function getBaseServiceToken(definition: Definition | { name: string }) {
  return `Base${definition.name}Service`;
}
