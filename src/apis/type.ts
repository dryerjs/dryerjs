import * as graphql from 'graphql';

export type ApiEndpoint = graphql.GraphQLFieldConfigMap<any, any>;

export interface Api {
    endpoint: ApiEndpoint;
}
