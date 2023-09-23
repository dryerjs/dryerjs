import mongoose from 'mongoose';
import { MongooseSchemaBuilder } from './mongoose-schema-builder';
import { GraphqlTypeBuilder } from './graphql-schema-builder';
import { CreateApi, DeleteApi, GetApi, ListApi, UpdateApi } from './apis';
import { Apollo } from './apollo';
import { DryerConfig } from './type';

export class Dryer {
    private constructor(private readonly config: DryerConfig) {}

    public static init(config: DryerConfig) {
        return new Dryer(config);
    }

    public async start() {
        await this.config?.beforeApplicationInit?.();
        let mutationFields = {};
        let queryFields = {};

        for (const name in this.config.modelDefinitions) {
            const modelDefinition = this.config.modelDefinitions[name];
            const mongooseSchema = MongooseSchemaBuilder.build(modelDefinition);
            const dbModel = mongoose.model(modelDefinition.name, mongooseSchema as any);
            const prebuiltGraphqlSchemaTypes = GraphqlTypeBuilder.build(modelDefinition);
            const model = {
                name: modelDefinition.name,
                db: dbModel,
                graphql: prebuiltGraphqlSchemaTypes,
                definition: modelDefinition,
            };

            mutationFields = {
                ...mutationFields,
                ...new CreateApi(model, {}).getEndpoint(),
                ...new UpdateApi(model, {}).getEndpoint(),
                ...new DeleteApi(model, {}).getEndpoint(),
            };
            queryFields = {
                ...queryFields,
                ...new GetApi(model, {}).getEndpoint(),
                ...new ListApi(model, {}).getEndpoint(),
            };
        }
        await mongoose.connect(this.config.mongoUri);
        await Apollo.start({
            mutationFields,
            queryFields,
            port: this.config.port,
            appendContext: this.config.appendContext,
        });
        await this.config?.afterApplicationInit?.();
    }
}
