import mongoose, { FilterQuery } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { Injector } from 'injection-js';
import { MongooseSchemaBuilder } from './mongoose-schema-builder';
import * as util from './util';
import { ModelDefinition, NonPrimitiveArrayKeyOf, Sort } from './shared';
import {
    CreateService,
    UpdateService,
    DeleteService,
    GetService,
    PaginateService,
    OutputService,
    GetAllService,
    EmbeddedModelService,
} from './services';
import { Context } from './dryer';
import { MetaKey, Metadata } from './metadata';

export class Model<T = any> {
    public readonly name: string;
    public readonly db: mongoose.PaginateModel<T>;

    constructor(
        public readonly definition: ModelDefinition<T>,
        public readonly injector: Injector,
    ) {
        const mongooseSchema = MongooseSchemaBuilder.build(definition);
        mongooseSchema.plugin(mongoosePaginate);
        const indexes = util.defaultTo(Metadata.getModelMetaValue(definition, MetaKey.Index), []);
        indexes.forEach(({ fields, options }) => mongooseSchema.index(fields, options));

        this.name = definition.name;
        this.db = mongoose.model<T, mongoose.PaginateModel<T>>(definition.name, mongooseSchema);
    }

    public inContext<ExtraContext>(context: Context<ExtraContext>) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const model = this;
        return {
            create: async (input: Partial<T>): Promise<T> => {
                return await this.injector.get(CreateService<T, ExtraContext>).create(input, context, this);
            },
            createRecursive: async (input: Partial<T>): Promise<T> => {
                return await this.injector
                    .get(CreateService<T, ExtraContext>)
                    .createRecursive(input, context, this);
            },
            update: async (id: string, input: Partial<T>): Promise<T> => {
                return await this.injector
                    .get(UpdateService<T, ExtraContext>)
                    .update(id, input, context, this);
            },
            delete: async (id: string) => {
                return await this.injector.get(DeleteService<T, ExtraContext>).delete(id, context, this);
            },
            get: async (id: string): Promise<T | null> => {
                return await this.injector.get(GetService<T, ExtraContext>).get(id, context, this);
            },
            getOne: async (filter: FilterQuery<T>): Promise<T | null> => {
                return await this.injector.get(GetService<T, ExtraContext>).getOne(context, this, filter);
            },
            getOrThrow: async (id: string): Promise<T> => {
                return await this.injector.get(GetService<T, ExtraContext>).getOrThrow(id, context, this);
            },
            paginate: async (query: FilterQuery<T>, options: { limit: number; page: number; sort: Sort }) => {
                return await this.injector
                    .get(PaginateService<T, ExtraContext>)
                    .paginate(query, options, context, this);
            },
            getAll: async (query: FilterQuery<T>, sort: Sort = {}) => {
                return await this.injector
                    .get(GetAllService<T, ExtraContext>)
                    .getAll(query, sort, context, this);
            },
            output: async (raw: T): Promise<T> => {
                return await this.injector
                    .get(OutputService<T, ExtraContext>)
                    .output(raw, context, this.definition);
            },
            onProperty: <K extends NonPrimitiveArrayKeyOf<T>>(propertyName: K) => {
                return {
                    withParent(parentId: string) {
                        return new EmbeddedModelService(
                            {
                                parentId,
                                context,
                                model,
                                propertyName,
                            },
                            model.injector,
                        );
                    },
                };
            },
        };
    }
}
