import { Schema } from 'mongoose';

export const ObjectId = Schema.Types.ObjectId;

export type ApiType =
  | 'paginate'
  | 'create'
  | 'update'
  | 'getOne'
  | 'remove'
  | 'getAll'
  | 'bulkCreate'
  | 'bulkUpdate'
  | 'bulkRemove';

export type AllowedApiType = '*' | 'essentials' | ApiType;
