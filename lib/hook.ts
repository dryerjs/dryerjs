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

export const hookMethods = [] as any[];

function HookMethod(typeFunc: () => any, hookName: string, options?: { priority: number }) {
  return (target: any, method: any) => {
    hookMethods.push({ typeFunc, target, method, hookName, options });
  };
}

export function BeforeReadFilter(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, BeforeReadFilter.name, options);
}

export function BeforeWriteFilter(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, BeforeWriteFilter.name, options);
}

export function BeforeCreate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, BeforeCreate.name, options);
}

export function AfterCreate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, AfterCreate.name, options);
}

export function BeforeUpdate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, BeforeUpdate.name, options);
}

export function AfterUpdate(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, AfterUpdate.name, options);
}

export function BeforeRemove(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, BeforeRemove.name, options);
}

export function AfterRemove(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, AfterRemove.name, options);
}

export function BeforeFindOne(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, BeforeFindOne.name, options);
}

export function AfterFindOne(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, AfterFindOne.name, options);
}

export function BeforeFindMany(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, BeforeFindMany.name, options);
}

export function AfterFindMany(typeFunc: () => any, options?: { priority: number }) {
  return HookMethod(typeFunc, AfterFindMany.name, options);
}

export const Hooks = {
  BeforeReadFilter: BeforeReadFilter.name,
  BeforeWriteFilter: BeforeWriteFilter.name,
  BeforeCreate: BeforeCreate.name,
  AfterCreate: AfterCreate.name,
  BeforeUpdate: BeforeUpdate.name,
  AfterUpdate: AfterUpdate.name,
  BeforeRemove: BeforeRemove.name,
  AfterRemove: AfterRemove.name,
  BeforeFindOne: BeforeFindOne.name,
  AfterFindOne: AfterFindOne.name,
  BeforeFindMany: BeforeFindMany.name,
  AfterFindMany: AfterFindMany.name,
};
