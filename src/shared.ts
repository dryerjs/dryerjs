import * as graphql from 'graphql';

import { Schema } from 'mongoose';

export const ObjectId = Schema.Types.ObjectId;

export type ModelDefinition<T = any> = new (...args: any[]) => T;

type NonPrimitiveArrayKeys<T> = {
    [K in keyof T]: T[K] extends Array<infer U>
        ? U extends string | number | boolean | Date
            ? never
            : K
        : never;
}[keyof T];

export type NonPrimitiveArrayKeyOf<T> = keyof Pick<T, NonPrimitiveArrayKeys<T>>;

export type NonPrimitiveArrayValueOf<T> = T[NonPrimitiveArrayKeyOf<T>];

export type UnwrapArray<T> = T extends Array<infer U> ? U : never;

export type GraphQLFieldConfigMap = graphql.GraphQLFieldConfigMap<any, any>;

export type TargetClass = any;

export enum RelationKind {
    HasMany = 'HasMany',
    BelongsTo = 'BelongsTo',
    HasOne = 'HasOne',
    ReferencesMany = 'ReferencesMany',
}

export type Relation = {
    kind: RelationKind;
    type: TargetClass;
    from: string;
    to: string;
};

export type ApiType = 'create' | 'update' | 'delete' | 'paginate' | 'get' | 'all';

export type SchemaOptions = {
    excluded?: ApiType[];
};

export type EmbeddedSchemaOptions = {
    type: TargetClass;
    excluded?: ApiType[];
};
