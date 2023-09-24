import { Request } from 'express';
import mongoose from 'mongoose';
import * as graphql from 'graphql';

export type ModelDefinition<T = any> = new (...args: any[]) => T;

export type AnyClass = new (...args: any[]) => any;

export type ContextFunction<Context, ModelCollection> = (
    req: Request,
    models: { [key in keyof ModelCollection]: Model<ModelCollection[key]> },
) => Context | Promise<Context>;

export interface DryerConfig<ModelCollection, Context> {
    modelDefinitions: ModelCollection;
    beforeApplicationInit?: Function;
    afterApplicationInit?: Function;
    mongoUri: string;
    port: number;
    appendContext?: ContextFunction<Context, ModelCollection>;
}

export type Model<T> = {
    name: string;
    db: mongoose.Model<T>;
    graphql: {
        output: graphql.GraphQLNonNull<graphql.GraphQLObjectType>;
        create: graphql.GraphQLInputObjectType;
        update: graphql.GraphQLInputObjectType;
    };
    definition: AnyClass;
};

export type ApiEndpoint = graphql.GraphQLFieldConfigMap<any, any>;

export interface Api {
    getEndpoint(): ApiEndpoint;
}
