import { FilterQuery } from 'mongoose';
import { Definition } from './definition';
import { RemoveOptions } from './remove-options';

export interface Hook<T = any, Context = any> {
  beforeCreate?(input: { ctx: Context; input: Partial<T>; definition: Definition }): Promise<void>;
  afterCreate?(input: { ctx: Context; input: Partial<T>; created: T; definition: Definition }): Promise<void>;

  beforeUpdate?(input: {
    ctx: Context;
    input: Partial<T>;
    beforeUpdated: T;
    definition: Definition;
  }): Promise<void>;
  afterUpdate?(input: {
    ctx: Context;
    input: Partial<T>;
    updated: T;
    beforeUpdated: T;
    definition: Definition;
  }): Promise<void>;

  beforeReadFilter?(input: { ctx: Context; filter: FilterQuery<T>; definition: Definition }): Promise<void>;
  beforeWriteFilter?(input: { ctx: Context; filter: FilterQuery<T>; definition: Definition }): Promise<void>;

  beforeFindOne?(input: { ctx: Context; filter: FilterQuery<T>; definition: Definition }): Promise<void>;
  afterFindOne?(input: {
    ctx: Context;
    filter: FilterQuery<T>;
    result: T;
    definition: Definition;
  }): Promise<void>;

  beforeRemove?(input: {
    ctx: Context;
    beforeRemoved: T;
    definition: Definition;
    options: RemoveOptions;
  }): Promise<void>;
  afterRemove?(input: {
    ctx: Context;
    removed: T;
    definition: Definition;
    options: RemoveOptions;
  }): Promise<void>;

  beforeFindMany?(input: {
    ctx: Context;
    filter: FilterQuery<T>;
    sort: object;
    limit?: number;
    page?: number;
    definition: Definition;
  }): Promise<void>;
  afterFindMany?(input: {
    ctx: Context;
    filter: FilterQuery<T>;
    sort: object;
    items: T[];
    limit?: number;
    page?: number;
    definition: Definition;
  }): Promise<void>;
}

export type AfterRemoveHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['afterRemove']
>[0];

export type BeforeRemoveHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['beforeRemove']
>[0];

export type AfterFindOneHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['afterFindOne']
>[0];

export type BeforeFindOneHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['beforeFindOne']
>[0];

export type AfterUpdateHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['afterUpdate']
>[0];

export type BeforeUpdateHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['beforeUpdate']
>[0];

export type AfterCreateHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['afterCreate']
>[0];

export type BeforeCreateHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['beforeCreate']
>[0];

export type BeforeFindManyHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['beforeFindMany']
>[0];

export type AfterFindManyHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['afterFindMany']
>[0];

export type BeforeReadFilterHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['beforeReadFilter']
>[0];

export type BeforeWriteFilterHookInput<T = any, Context = any> = Parameters<
  Required<Hook<T, Context>>['beforeWriteFilter']
>[0];

export class AllDefinitions {}

export const hookMethods = [] as any[];

function HookMethod(typeFunc: () => any, hookName: string, options?: { priority: number }) {
  return (target: any, method: any) => {
    hookMethods.push({ typeFunc, target, method, hookName, options });
  };
}

export function BeforeReadFilter(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'beforeReadFilter', options);
}

export function BeforeWriteFilter(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'beforeWriteFilter', options);
}

export function BeforeCreate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'beforeCreate', options);
}

export function AfterCreate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'afterCreate', options);
}

export function BeforeUpdate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'beforeUpdate', options);
}

export function AfterUpdate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'afterUpdate', options);
}

export function BeforeRemove(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'beforeRemove', options);
}

export function AfterRemove(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'afterRemove', options);
}

export function BeforeFindOne(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'beforeFindOne', options);
}

export function AfterFindOne(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'afterFindOne', options);
}

export function BeforeFindMany(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'beforeFindMany', options);
}

export function AfterFindMany(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'afterFindMany', options);
}

export function HookFilter(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, 'hookFilter', options);
}
