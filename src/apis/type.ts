import * as graphql from 'graphql';

export type ApiEndpoint = graphql.GraphQLFieldConfigMap<any, any>;

export interface Api {
    getEndpoint(): ApiEndpoint;
}
