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

export type Ref<T> = T;

export type FilterOperator =
  | 'eq'
  | 'in'
  | 'notEq'
  | 'notIn'
  | 'contains'
  | 'notContains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'regex'
  | 'notRegex'
  | 'all'
  | 'exists';

export const allOperators: FilterOperator[] = [
  'eq',
  'in',
  'notEq',
  'notIn',
  'contains',
  'notContains',
  'gt',
  'gte',
  'lt',
  'lte',
  'regex',
  'notRegex',
  'all',
  'exists',
];
