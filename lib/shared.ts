export * from './object-id';
import { Definition } from './definition';
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

export enum QueryContextSource {
  BelongsTo = 'BelongsTo',
  HasMany = 'HasMany',
  HasOne = 'HasOne',
  ReferencesMany = 'ReferencesMany',
  RootFindAll = 'RootFindAll',
  RootPaginate = 'RootPaginate',
}

export type QueryContext = {
  source: QueryContextSource | string;
  parent?: any;
  parentDefinition: Definition;
};

export const QueryContextSymbol = Symbol('QueryContext');

export const getQueryContextFromFilter = (filter: any): QueryContext | undefined => {
  return filter[QueryContextSymbol];
};

export const setQueryContextForFilter = (filter: any, queryContext): void => {
  filter[QueryContextSymbol] = queryContext;
};
