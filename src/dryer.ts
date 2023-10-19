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
import {
    CreateService,
    DeleteService,
    GetAllService,
    GetService,
    OutputService,
    PaginateService,
    UpdateService,
} from './services';
import { ObjectProcessor } from './services/object-processor';

export type ContextFunction<ExtraContext> = (
    req: express.Request,
    dryer: Dryer<ExtraContext>,
) => Promise<ExtraContext>;

export interface DryerConfig<ExtraContext> {
    modelDefinitions: ModelDefinition[];
    beforeApplicationInit?: () => void | Promise<void>;
    afterApplicationInit?: () => void | Promise<void>;
    mongoUri: string;
    port: number;
    appendContext?: ContextFunction<ExtraContext>;
    providers?: Provider[];
    resolvers?: Provider[];
}

export class Dryer<ExtraContext> {
    protected constructor(private readonly config: DryerConfig<ExtraContext>) {}

    public static init<ExtraContext>(config: DryerConfig<ExtraContext>) {
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
            CreateService,
            UpdateService,
            DeleteService,
            GetService,
            PaginateService,
            OutputService,
            GetAllService,
            ObjectProcessor,
        ]);
        let mutationFields = {};
        let queryFields = {};

        for (const modelDefinition of this.config.modelDefinitions) {
            const model = new Model(modelDefinition, this.injector);
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
            port: this.config.port,
            getContext: async (req: express.Request) => {
                const additional = await this.config.appendContext?.(req, this);
                return {
                    ...additional,
                    dryer: this,
                };
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

export type BaseContext = { dryer: Dryer<any> };

export type Context<ExtraContext> = BaseContext & ExtraContext;
