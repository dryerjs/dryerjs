import { Injectable } from '@nestjs/common';
import { MetaKey, Metadata } from './metadata';

export function Hook(typeFunc: () => any) {
  return (target: any) => {
    Injectable()(target);
    Metadata.for(target).set(MetaKey.Hook, typeFunc);
  };
}

export interface Hook<Context = any, T = any> {
  beforeCreate?(ctx: Context, input: Partial<T>): Promise<void>;
  afterCreate?(ctx: Context, result: T): Promise<void>;

  beforeUpdate?(ctx: Context, result: Partial<T>): Promise<void>;
  afterUpdate?(ctx: Context, result: T): Promise<void>;

  beforeGetOne?(ctx: Context, id: string): Promise<void>;
  afterGetOne?(ctx: Context, result: T): Promise<void>;

  beforeGetAll?(ctx: Context, result: T): Promise<void>;
  afterGetAll?(ctx: Context, result: T): Promise<void>;

  beforeRemove?(ctx: Context, id: string): Promise<void>;
  afterRemove?(ctx: Context, result: T): Promise<void>;

  beforePaginate?(ctx: Context, result: T): Promise<void>;
  afterPaginate?(ctx: Context, result: T): Promise<void>;
}
