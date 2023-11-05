import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { MetaKey, Metadata } from './metadata';

export function Hook(typeFunc: () => any) {
  return (target: any) => {
    Injectable()(target);
    Metadata.for(target).set(MetaKey.Hook, typeFunc);
  };
}

export interface Hook<T = any, Context = any> {
  beforeCreate(input: { ctx: Context; input: Partial<T> }): Promise<void>;
  afterCreate?(input: { ctx: Context; input: Partial<T>; created: T }): Promise<void>;

  beforeUpdate?(input: { ctx: Context; input: Partial<T>; beforeUpdated: T }): Promise<void>;
  afterUpdate?(input: { ctx: Context; input: Partial<T>; updated: T; beforeUpdated: T }): Promise<void>;

  beforeFindOne?(input: { ctx: Context; filter: FilterQuery<T> }): Promise<void>;
  afterFindOne?(input: { ctx: Context; filter: FilterQuery<T>; result: T }): Promise<void>;

  beforeRemove?(input: { ctx: Context; beforeRemoved: T }): Promise<void>;
  afterRemove?(input: { ctx: Context; removed: T }): Promise<void>;

  beforeFindMany?(input: {
    ctx: Context;
    filter: FilterQuery<T>;
    sort: object;
    limit?: number;
    page?: number;
  }): Promise<void>;
  afterFindMany?(input: {
    ctx: Context;
    filter: FilterQuery<T>;
    sort: object;
    items: T[];
    limit?: number;
    page?: number;
  }): Promise<void>;
}

export class AllDefinitions {}
