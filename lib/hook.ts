import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { MetaKey, Metadata } from './metadata';
import { Definition } from './definition';
import { RemoveOptions } from './remove-options';

export function Hook(typeFunc: () => any) {
  return (target: any) => {
    Injectable()(target);
    Metadata.for(target).set(MetaKey.Hook, typeFunc);
  };
}

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

export class AllDefinitions {}
