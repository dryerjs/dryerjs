import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { MetaKey, Metadata } from './metadata';

export function Hook(typeFunc: () => any) {
  return (target: any) => {
    Injectable()(target);
    Metadata.for(target).set(MetaKey.Hook, typeFunc);
  };
}

export interface Hook<Context = any, T = any> {
  beforeCreate?(input: { ctx: Context; input: Partial<T> }): Promise<void>;
  afterCreate?(input: { ctx: Context; input: Partial<T>; created: T }): Promise<void>;

  beforeUpdate?(input: { ctx: Context; input: Partial<T>; beforeUpdated: T }): Promise<void>;
  afterUpdate?(input: { ctx: Context; input: Partial<T>; updated: T; beforeUpdated: T }): Promise<void>;

  beforeGetOne?(input: { ctx: Context; filter: FilterQuery<T> }): Promise<void>;
  afterGetOne?(input: { ctx: Context; result: T }): Promise<void>;

  beforeGetAll?(input: { ctx: Context; result: T }): Promise<void>;
  afterGetAll?(input: { ctx: Context; result: T }): Promise<void>;

  beforeRemove?(input: { ctx: Context; beforeRemoved: T }): Promise<void>;
  afterRemove?(input: { ctx: Context; removed: T }): Promise<void>;

  beforePaginate?(input: { ctx: Context; result: T }): Promise<void>;
  afterPaginate?(input: { ctx: Context; result: T }): Promise<void>;
}
