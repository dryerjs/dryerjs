import { Provider, ReflectiveInjector } from './injection';
import * as express from 'express';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import * as util from './util';
import { Apollo } from './apollo';
import { ModelDefinition } from './shared';
import { Model } from './model';
import { ApisBuilder } from './apis-builder';
import { ResolverProcessor } from './resolver-processor';
import { PubSubEngine } from 'graphql-subscriptions';

export type ContextFunction<Context> = (
    req: express.Request,
    dryer: Dryer<Context>,
) => Context | Promise<Context>;

export interface DryerConfig<Context> {
    modelDefinitions: ModelDefinition[];
    beforeApplicationInit?: () => void | Promise<void>;
    afterApplicationInit?: () => void | Promise<void>;
    mongoUri: string;
    port: number;
    appendContext?: ContextFunction<Context>;
    providers?: Provider[];
    resolvers?: Provider[];
    pubSub?: PubSubEngine;
}

export class Dryer<Context> {
    protected constructor(private readonly config: DryerConfig<Context>) {}

    public static init<Context>(config: DryerConfig<Context>) {
        return new Dryer(config);
    }

    public apolloServer: ApolloServer;
    public expressApp: express.Express;
    public mongoose: mongoose.Mongoose;
    public injector: ReflectiveInjector;

    protected readonly models: { [key: string]: Model } = {};

    public model<T>(modelDefinition: ModelDefinition<T>): Model<T> {
        return this.models[modelDefinition.name];
    }

    public async start() {
        await this.config?.beforeApplicationInit?.();
        this.injector = ReflectiveInjector.resolveAndCreate([
            ...(this.config.providers || []),
            ...(this.config.resolvers || []),
            {
                provide: Dryer,
                useValue: this,
            },
        ]);
        let mutationFields = {};
        let queryFields = {};
        let subscriptionFields = {};

        for (const modelDefinition of this.config.modelDefinitions) {
            const model = new Model(modelDefinition);
            this.models[modelDefinition.name] = model;

            const apis = new ApisBuilder(model).build();
            mutationFields = {
                ...mutationFields,
                ...apis.mutationFields,
            };
            queryFields = {
                ...queryFields,
                ...apis.queryFields,
            };
            subscriptionFields = {
                ...apis.subscriptionFields,
            };
        }

        for (const resolver of util.defaultTo(this.config.resolvers, [])) {
            const apis = ResolverProcessor.get(resolver, this.injector);
            queryFields = {
                ...queryFields,
                ...apis.queryFields,
            };
            mutationFields = {
                ...mutationFields,
                ...apis.mutationFields,
            };
        }

        this.mongoose = await mongoose.connect(this.config.mongoUri);
        const { apolloServer, expressApp } = await Apollo.start({
            mutationFields,
            queryFields,
            subscriptionFields,
            port: this.config.port,
            getContext: async (req: express.Request) => {
                const additional = await this.config.appendContext?.(req, this);
                return {
                    ...additional,
                    dryer: this,
                };
            },
            getWsContext: async (ctx: BaseContext) => {
                return { ...ctx, pubSub: this.config?.pubSub };
            },
        });
        this.apolloServer = apolloServer;
        this.expressApp = expressApp;
        await this.config?.afterApplicationInit?.();
        /* istanbul ignore next */
        const onStopSignal = () => {
            console.log('Received SIGINT. Shutting down gracefully...');
            this.stop().then(() => {
                console.log('Server stopped.');
                process.exit(0); // Exit the process
            });
        };
        process.on('SIGINT', onStopSignal);
    }

    public async stop() {
        await this.mongoose.connection.close();
        await this.apolloServer.stop();
    }
}

export type BaseContext = { dryer: Dryer<any>; pubSub: PubSubEngine };
