import { Request } from 'express';
import mongoose from 'mongoose';
import { MongooseSchemaBuilder } from './mongoose-schema-builder';
import { GraphqlTypeBuilder } from './graphql-schema-builder';
import { CreateApi, DeleteApi, GetApi, ListApi, UpdateApi } from './apis';
import { Apollo } from './apollo';
import { DryerConfig, Model } from './type';
import { inContext } from './services';

export class Dryer<ModelCollection> {
    private constructor(private readonly config: DryerConfig<any, any>) {}

    public static init<ModelCollection, Context>(config: DryerConfig<ModelCollection, Context>) {
        return new Dryer<ModelCollection>(config);
    }

    public readonly models: { [key in keyof ModelCollection]: Model<ModelCollection[key]> } = {} as any;

    public async start() {
        await this.config?.beforeApplicationInit?.();
        let mutationFields = {};
        let queryFields = {};

        for (const name in this.config.modelDefinitions) {
            const modelDefinition = this.config.modelDefinitions[name];
            const mongooseSchema = MongooseSchemaBuilder.build(modelDefinition);
            const dbModel = mongoose.model(modelDefinition.name, mongooseSchema as any);
            const prebuiltGraphqlSchemaTypes = GraphqlTypeBuilder.build(modelDefinition);
            const model: Model<any> = {
                name: modelDefinition.name,
                db: dbModel,
                graphql: prebuiltGraphqlSchemaTypes,
                definition: modelDefinition,
                inContext: {} as any,
            };

            model.inContext = inContext(model) as any;

            this.models[name] = model;

            mutationFields = {
                ...mutationFields,
                ...new CreateApi(model).getEndpoint(),
                ...new UpdateApi(model).getEndpoint(),
                ...new DeleteApi(model).getEndpoint(),
            };
            queryFields = {
                ...queryFields,
                ...new GetApi(model).getEndpoint(),
                ...new ListApi(model).getEndpoint(),
            };
        }
        await mongoose.connect(this.config.mongoUri);
        await Apollo.start({
            mutationFields,
            queryFields,
            port: this.config.port,
            getContext: async (req: Request) => {
                const additional = await this.config.appendContext?.(req, this.models);
                return {
                    ...additional,
                    models: this.models,
                };
            },
        });
        await this.config?.afterApplicationInit?.();
    }
}
