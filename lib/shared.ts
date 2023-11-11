export * from './object-id';
import { ObjectId } from './object-id';

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
