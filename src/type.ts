import * as graphql from 'graphql';

export type ModelDefinition<T = any> = new (...args: any[]) => T;

export type AnyClass = new (...args: any[]) => any;

export type ApiEndpoint = graphql.GraphQLFieldConfigMap<any, any>;

export interface Api {
    getEndpoint(): ApiEndpoint;
}
