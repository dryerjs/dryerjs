import { FilterQuery } from 'mongoose';

import { Definition } from './definition';
import { RemoveOptions } from './remove-options';

export type AfterRemoveHookInput<T = any, Context = any> = {
  ctx: Context;
  removed: T;
  definition: Definition;
  options: RemoveOptions;
};

export type BeforeRemoveHookInput<T = any, Context = any> = {
  ctx: Context;
  beforeRemoved: T;
  definition: Definition;
  options: RemoveOptions;
};

export type AfterFindOneHookInput<T = any, Context = any> = {
  ctx: Context;
  filter: FilterQuery<T>;
  result: T;
  definition: Definition;
};

export type BeforeFindOneHookInput<T = any, Context = any> = {
  ctx: Context;
  filter: FilterQuery<T>;
  definition: Definition;
};

export type AfterUpdateHookInput<T = any, Context = any> = {
  ctx: Context;
  input: Partial<T>;
  updated: T;
  beforeUpdated: T;
  definition: Definition;
};

export type BeforeUpdateHookInput<T = any, Context = any> = {
  ctx: Context;
  input: Partial<T>;
  beforeUpdated: T;
  definition: Definition;
};

export type AfterCreateHookInput<T = any, Context = any> = {
  ctx: Context;
  input: Partial<T>;
  created: T;
  definition: Definition;
};

export type BeforeCreateHookInput<T = any, Context = any> = {
  ctx: Context;
  input: Partial<T>;
  definition: Definition;
};

export type BeforeFindManyHookInput<T = any, Context = any> = {
  ctx: Context;
  filter: FilterQuery<T>;
  sort: object;
  limit?: number;
  page?: number;
  definition: Definition;
};

export type AfterFindManyHookInput<T = any, Context = any> = {
  ctx: Context;
  filter: FilterQuery<T>;
  sort: object;
  items: T[];
  limit?: number;
  page?: number;
  definition: Definition;
};

export type BeforeReadFilterHookInput<T = any, Context = any> = {
  ctx: Context;
  filter: FilterQuery<T>;
  definition: Definition;
};

export type BeforeWriteFilterHookInput<T = any, Context = any> = {
  ctx: Context;
  filter: FilterQuery<T>;
  definition: Definition;
};

export class AllDefinitions {}

export enum Hook {
  BeforeReadFilter = 'BeforeReadFilter',
  BeforeWriteFilter = 'BeforeWriteFilter',
  BeforeCreate = 'BeforeCreate',
  AfterCreate = 'AfterCreate',
  BeforeUpdate = 'BeforeUpdate',
  AfterUpdate = 'AfterUpdate',
  BeforeRemove = 'BeforeRemove',
  AfterRemove = 'AfterRemove',
  BeforeFindOne = 'BeforeFindOne',
  AfterFindOne = 'AfterFindOne',
  BeforeFindMany = 'BeforeFindMany',
  AfterFindMany = 'AfterFindMany',
}

export const hookMethods: {
  typeFunc: () => any;
  target: any;
  method: string;
  hook: Hook;
  options?: { priority: number };
}[] = [];

function HookMethod(typeFunc: () => any, hook: Hook, options?: { priority: number }) {
  return (target: any, method: any) => {
    hookMethods.push({ typeFunc, target, method, hook, options });
  };
}

export function BeforeReadFilterHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.BeforeReadFilter, options);
}

export function BeforeWriteFilterHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.BeforeWriteFilter, options);
}

export function BeforeCreateHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.BeforeCreate, options);
}

export function AfterCreateHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.AfterCreate, options);
}

export function BeforeUpdateHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.BeforeUpdate, options);
}

export function AfterUpdateHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.AfterUpdate, options);
}

export function BeforeRemoveHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.BeforeRemove, options);
}

export function AfterRemoveHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.AfterRemove, options);
}

export function BeforeFindOneHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.BeforeFindOne, options);
}

export function AfterFindOneHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.AfterFindOne, options);
}

export function BeforeFindManyHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.BeforeFindMany, options);
}

export function AfterFindManyHook(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, Hook.AfterFindMany, options);
}
