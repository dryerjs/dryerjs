import mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { MongooseSchemaBuilder } from './mongoose-schema-builder';
import { ModelDefinition } from './type';
import { GraphqlTypeBuilder } from './graphql-schema-builder';
import {
    CreateService,
    UpdateService,
    DeleteService,
    GetService,
    ListService,
    OutputService,
    GetAllService,
} from './services';

export class Model<T = any> {
    public readonly name: string;
    public readonly db: mongoose.PaginateModel<T>;
    public readonly graphql: ReturnType<typeof GraphqlTypeBuilder.build>;

    constructor(public readonly definition: ModelDefinition<T>) {
        const mongooseSchema = MongooseSchemaBuilder.build(definition);
        mongooseSchema.plugin(mongoosePaginate);
        this.name = definition.name;
        this.db = mongoose.model<T, mongoose.PaginateModel<T>>(definition.name, mongooseSchema);
        this.graphql = GraphqlTypeBuilder.build(definition);
    }

    public inContext<Context>(context: Context) {
        return {
            create: async (input: Partial<T>): Promise<T> => {
                return await CreateService.create(input, context, this);
            },
            update: async (id: string, input: Partial<T>): Promise<T> => {
                return await UpdateService.update<T, Context>(id, input, context, this);
            },
            delete: async (id: string) => {
                return await DeleteService.delete<T, Context>(id, context, this);
            },
            get: async (id: string): Promise<T | null> => {
                return await GetService.get<T, Context>(id, context, this);
            },
            getOrThrow: async (id: string): Promise<T> => {
                return await GetService.getOrThrow<T, Context>(id, context, this);
            },
            list: async (skip: number, take: number) => {
                return await ListService.list<T, Context>(skip, take, context, this);
            },
            getAll: async () => {
                return await GetAllService.getAll(context, this);
            },
            output: async (raw: T): Promise<T> => {
                return await OutputService.output<T, Context>(raw, context, this);
            },
        };
    }
}
