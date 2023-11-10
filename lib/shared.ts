import { Schema } from 'mongoose';

export type ObjectId = Schema.Types.ObjectId;
export const ObjectId = Schema.Types.ObjectId;

export type StringLikeId = ObjectId | string | number;

export type ApiType =
  | 'paginate'
  | 'create'
  | 'update'
  | 'findOne'
  | 'remove'
  | 'findAll'
  | 'bulkCreate'
  | 'bulkUpdate'
  | 'bulkRemove';

export type AllowedApiType = '*' | 'essentials' | ApiType;
