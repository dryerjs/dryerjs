import mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { MongooseSchemaBuilder } from './mongoose-schema-builder';
import { ModelDefinition, NonPrimitiveArrayKeyOf } from './shared';
import {
    CreateService,
    UpdateService,
    DeleteService,
    GetService,
    PaginateService,
    OutputService,
    GetAllService,
    EmbeddedService,
} from './services';

export interface ModelGetter {
    model<T>(modelDefinition: ModelDefinition<T>): Model<T>;
}

export class Model<T = any> {
    public readonly name: string;
    public readonly db: mongoose.PaginateModel<T>;

    constructor(public readonly definition: ModelDefinition<T>) {
        const mongooseSchema = MongooseSchemaBuilder.build(definition);
        mongooseSchema.plugin(mongoosePaginate);
        this.name = definition.name;
        this.db = mongoose.model<T, mongoose.PaginateModel<T>>(definition.name, mongooseSchema);
    }

    public inContext<Context>(context: Context) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const model = this;
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
            paginate: async (skip: number, take: number) => {
                return await PaginateService.paginate<T, Context>(skip, take, context, this);
            },
            getAll: async (filter = {}) => {
                return await GetAllService.getAll(context, this, filter);
            },
            output: async (raw: T): Promise<T> => {
                return await OutputService.output<T, Context>(raw, context, this);
            },
            onProperty: <K extends NonPrimitiveArrayKeyOf<T>>(propertyName: K) => {
                return {
                    withParent(parentId: string) {
                        return EmbeddedService.getEmbeddedModel<T, K, Context>({
                            parentId,
                            context,
                            model,
                            propertyName,
                        });
                    },
                };
            },
        };
    }
}
