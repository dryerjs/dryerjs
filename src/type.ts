import { Request } from 'express';
import mongoose from 'mongoose';
import * as graphql from 'graphql';
import { inContext } from 'services';

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
    inContext: (context: any) => {
        create(input: Partial<T>): Promise<T>;
        update(id: string, input: Partial<T>): Promise<T>;
        get(id: string): Promise<T | null>;
        getOrThrow(id: string): Promise<T>;
        delete(id: string): Promise<void>;
        output(raw: T): Promise<T>;
        list(skip: number, take: number): Promise<T[]>;
    };
};

export type ApiEndpoint = graphql.GraphQLFieldConfigMap<any, any>;

export interface Api {
    getEndpoint(): ApiEndpoint;
}
