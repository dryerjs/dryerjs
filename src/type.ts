import * as graphql from 'graphql';

export type BaseModelDefinition = { excludeApis?: string[] };

export type SchemaOptions = {
    excludeApis?: ApiType | ApiType[];
};

export type ModelDefinition<T = any> = new (...args: any[]) => T;

export type AnyClass = new (...args: any[]) => any;

export type ApiEndpoint = graphql.GraphQLFieldConfigMap<any, any>;

export interface Api {
    getEndpoint(): ApiEndpoint;
}

export enum ApiType {
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
    GetOne = 'getOne',
    GetAll = 'getAll',
    List = 'list',
}
