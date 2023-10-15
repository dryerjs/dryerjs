import * as graphql from 'graphql';
import * as util from './util';
import { Model } from './model';
import { Typer } from './typer';
import { Property } from './property';
import { inspect } from './inspect';
import { ApiType, GraphQLFieldConfigMap } from './shared';
import { BaseContext } from './dryer';
import { MongoHelper } from './mongo-helper';

const deleteResponse = new graphql.GraphQLObjectType({
    name: `DeleteResponse`,
    fields: {
        deleted: { type: new graphql.GraphQLNonNull(graphql.GraphQLBoolean) },
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
    },
});

export class ApisBuilder<T, Context extends BaseContext> {
    constructor(private model: Model<T>) {}

    public build() {
        let queryFields: GraphQLFieldConfigMap = {};

        let mutationFields: GraphQLFieldConfigMap = {};

        let subscriptionFields: GraphQLFieldConfigMap = {};

        const apiConfigs: { api: () => GraphQLFieldConfigMap; kind: 'query' | 'mutation' | 'subscription'; type: ApiType }[] =
            [
                { api: () => this.getOne(), kind: 'query', type: 'get' },
                { api: () => this.paginate(), kind: 'query', type: 'paginate' },
                { api: () => this.getAll(), kind: 'query', type: 'all' },
                { api: () => this.create(), kind: 'mutation', type: 'create' },
                { api: () => this.update(), kind: 'mutation', type: 'update' },
                { api: () => this.delete(), kind: 'mutation', type: 'delete' },
                { api: () => this.onCreated(), kind: 'subscription', type: 'create' },
            ];

        for (const apiConfig of apiConfigs) {
            if (inspect(this.model.definition).isApiExcluded(apiConfig.type)) continue;
            if (apiConfig.kind === 'query') queryFields = { ...queryFields, ...apiConfig.api() };
            if (apiConfig.kind === 'mutation') mutationFields = { ...mutationFields, ...apiConfig.api() };
            if (apiConfig.kind === 'subscription') subscriptionFields = { ...subscriptionFields, ...apiConfig.api() };
        }

        const embeddedArrayProperties = inspect(this.model.definition)
            .getEmbeddedProperties()
            .filter(property => property.isArray());

        for (const property of embeddedArrayProperties) {
            const apiConfigs: {
                api: () => GraphQLFieldConfigMap;
                kind: 'query' | 'mutation';
                type: ApiType;
            }[] = [
                { api: () => this.getOneEmbedded(property), kind: 'query', type: 'get' },
                { api: () => this.getAllEmbedded(property), kind: 'query', type: 'all' },
                {
                    api: () => this.createEmbedded(property),
                    kind: 'mutation',
                    type: 'create',
                },
                {
                    api: () => this.updateEmbedded(property),
                    kind: 'mutation',
                    type: 'update',
                },
                {
                    api: () => this.deleteEmbedded(property),
                    kind: 'mutation',
                    type: 'delete',
                },
            ];
            for (const apiConfig of apiConfigs) {
                if (property.isEmbeddedApiExcluded(apiConfig.type)) continue;
                if (apiConfig.kind === 'query') queryFields = { ...queryFields, ...apiConfig.api() };
                if (apiConfig.kind === 'mutation') mutationFields = { ...mutationFields, ...apiConfig.api() };
            }
        }

        return {
            queryFields,
            mutationFields,
            subscriptionFields,
        };
    }

    private getOne() {
        return {
            [util.toCamelCase(this.model.name)]: {
                type: Typer.get(this.model.definition).nonNullOutput,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }: { id: string }, context: Context) => {
                    return this.model.inContext(context).getOrThrow(id);
                },
            },
        };
    }

    private getAll() {
        const args = {};
        const { filter, sort } = Typer.get(this.model.definition);
        if (filter) args['filter'] = { type: filter };
        if (sort) args['sort'] = { type: sort };

        return {
            [`all${util.plural(this.model.name)}`]: {
                type: new graphql.GraphQLList(Typer.get(this.model.definition).nonNullOutput),
                args,
                resolve: async (_parent, { filter = {}, sort = {} }, context: Context) => {
                    return await this.model
                        .inContext(context)
                        .getAll(MongoHelper.toQuery(filter), MongoHelper.toSort(sort));
                },
            } as any,
        };
    }

    private paginate() {
        return {
            [`paginate${util.plural(this.model.name)}`]: {
                type: Typer.get(this.model.definition).paginatedOutput,
                args: {
                    options: { type: Typer.get(this.model.definition).paginatedOptions },
                } as any,
                resolve: async (
                    _parent,
                    { options: { limit = 10, page = 1, filter = {}, sort = {} } = {} },
                    context: Context,
                ) => {
                    return await this.model.inContext(context).paginate(MongoHelper.toQuery(filter), {
                        limit,
                        page,
                        sort: MongoHelper.toSort(sort),
                    });
                },
            },
        };
    }

    private create() {
        return {
            [`create${this.model.name}`]: {
                type: Typer.get(this.model.definition).nonNullOutput,
                args: {
                    input: { type: new graphql.GraphQLNonNull(Typer.get(this.model.definition).create) },
                },
                resolve: async (_parent: any, { input }: { input: Partial<T> }, context: Context) => {
                    return await this.model.inContext(context).createRecursive(input);
                },
            },
        };
    }

    private update() {
        return {
            [`update${this.model.name}`]: {
                type: Typer.get(this.model.definition).nonNullOutput,
                args: {
                    input: { type: new graphql.GraphQLNonNull(Typer.get(this.model.definition).update) },
                },
                resolve: async (
                    _parent: any,
                    { input }: { input: Partial<T> & { id: string } },
                    context: Context,
                ) => {
                    return this.model.inContext(context).update(input.id, input);
                },
            },
        };
    }

    private delete() {
        return {
            [`delete${this.model.name}`]: {
                type: deleteResponse,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }: { id: string }, context: Context) => {
                    await this.model.inContext(context).delete(id);
                    return { deleted: true, id };
                },
            },
        };
    }

    private getOneEmbedded(property: Property) {
        const idKey = `${util.toCamelCase(this.model.name)}Id`;
        return {
            [`${util.toCamelCase(this.model.name)}${util.toPascalCase(util.singular(property.name))}`]: {
                type: Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput,
                args: {
                    [`${util.toCamelCase(this.model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                },
                resolve: async (_parent, { id, [idKey]: parentId }: any, context: Context) => {
                    return await this.model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .getOrThrow(id);
                },
            },
        };
    }

    private getAllEmbedded(property: Property) {
        const idKey = `${util.toCamelCase(this.model.name)}Id`;
        return {
            [`all${this.model.name}${util.plural(property.getEmbeddedModelDefinition().name)}`]: {
                type: new graphql.GraphQLList(Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput),
                args: {
                    [idKey]: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                },
                resolve: async (_parent, { [idKey]: parentId }: any, context: Context) => {
                    return await this.model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .getAll();
                },
            },
        };
    }

    private updateEmbedded(property: Property) {
        const idKey = `${util.toCamelCase(this.model.name)}Id`;
        return {
            [`update${this.model.name}${util.toPascalCase(util.singular(property.name))}`]: {
                type: Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput,
                args: {
                    [`${util.toCamelCase(this.model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    input: {
                        type: new graphql.GraphQLNonNull(
                            Typer.get(property.getEmbeddedModelDefinition()).update,
                        ),
                    },
                },
                resolve: async (_parent, { [idKey]: parentId, input }: any, context: Context) => {
                    return this.model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .update(input.id, input);
                },
            },
        };
    }

    private createEmbedded(property: Property) {
        const idKey = `${util.toCamelCase(this.model.name)}Id`;
        return {
            [`create${this.model.name}${util.toPascalCase(util.singular(property.name))}`]: {
                type: Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput,
                args: {
                    [`${util.toCamelCase(this.model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    input: {
                        type: new graphql.GraphQLNonNull(
                            Typer.get(property.getEmbeddedModelDefinition()).create,
                        ),
                    },
                },
                resolve: async (_parent, { [idKey]: parentId, input }: any, context: Context) => {
                    return await this.model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .create(input);
                },
            },
        };
    }

    private deleteEmbedded(property: Property) {
        const idKey = `${util.toCamelCase(this.model.name)}Id`;
        return {
            [`delete${this.model.name}${util.toPascalCase(util.singular(property.name))}`]: {
                type: deleteResponse,
                args: {
                    [`${util.toCamelCase(this.model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                },
                resolve: async (_parent, { id, [idKey]: parentId }: any, context: Context) => {
                    await this.model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .delete(id);
                    return { deleted: true, id };
                },
            },
        };
    }

    private onCreated() {
        return {
            [`on${this.model.name}Created`]: {
                type: Typer.get(this.model.definition).nonNullOutput,
                subscribe: (_parent, _args, context: Context) => {
                    return context.pubSub.asyncIterator(util.toUpperCase(`${this.model.name}_CREATED`));
                }
            },
        };
    }
}
