import * as graphql from 'graphql';

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
