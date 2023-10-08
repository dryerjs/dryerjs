import * as graphql from 'graphql';
import * as util from './util';
import { Model } from './model';
import { Typer } from './typer';
import { Property } from './property';
import { inspect } from './inspect';
import { GraphQLFieldConfigMap } from './shared';

const deleteResponse = new graphql.GraphQLObjectType({
    name: `DeleteResponse`,
    fields: {
        deleted: { type: new graphql.GraphQLNonNull(graphql.GraphQLBoolean) },
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
    },
});

export class ApisBuilder {
    public static build<T, Context>(model: Model<T>) {
        let queryFields: GraphQLFieldConfigMap = {
            ...this.getOne<T, Context>(model),
            ...this.paginate<T, Context>(model),
            ...this.getAll<T, Context>(model),
        };
        let mutationFields: GraphQLFieldConfigMap = {
            ...this.create<T, Context>(model),
            ...this.update<T, Context>(model),
            ...this.delete<T, Context>(model),
        };

        const embeddedArrayProperties = inspect(model.definition)
            .getEmbeddedProperties()
            .filter(property => property.isArray());

        for (const property of embeddedArrayProperties) {
            queryFields = {
                ...queryFields,
                ...this.getOneEmbedded<T, Context>(model, property),
                ...this.getAllEmbedded<T, Context>(model, property),
            };
            mutationFields = {
                ...mutationFields,
                ...this.createEmbedded<T, Context>(model, property),
                ...this.updateEmbedded<T, Context>(model, property),
                ...this.deleteEmbedded<T, Context>(model, property),
            };
        }

        return {
            queryFields,
            mutationFields,
        };
    }

    private static getOne<T, Context>(model: Model<T>) {
        return {
            [util.toCamelCase(model.name)]: {
                type: Typer.get(model.definition).nonNullOutput,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }: { id: string }, context: Context) => {
                    return model.inContext(context).getOrThrow(id);
                },
            },
        };
    }

    private static getAll<T, Context>(model: Model<T>) {
        return {
            [`all${util.plural(model.name)}`]: {
                type: new graphql.GraphQLList(Typer.get(model.definition).nonNullOutput),
                resolve: async (_parent, _args, context: Context) => {
                    return await model.inContext(context).getAll();
                },
            },
        };
    }

    private static paginate<T, Context>(model: Model<T>) {
        return {
            [`paginate${util.plural(model.name)}`]: {
                type: Typer.get(model.definition).paginatedOutput,
                args: { skip: { type: graphql.GraphQLInt }, take: { type: graphql.GraphQLInt } },
                resolve: async (_parent, { skip = 0, take = 10 }, context: Context) => {
                    const result = await model.inContext(context).paginate(skip, take);
                    return result;
                },
            },
        };
    }

    private static create<T, Context>(model: Model<T>) {
        return {
            [`create${model.name}`]: {
                type: Typer.get(model.definition).nonNullOutput,
                args: { input: { type: new graphql.GraphQLNonNull(Typer.get(model.definition).create) } },
                resolve: async (_parent: any, { input }: { input: Partial<T> }, context: Context) => {
                    return await model.inContext(context).create(input);
                },
            },
        };
    }

    private static update<T, Context>(model: Model<T>) {
        return {
            [`update${model.name}`]: {
                type: Typer.get(model.definition).nonNullOutput,
                args: {
                    input: { type: new graphql.GraphQLNonNull(Typer.get(model.definition).update) },
                },
                resolve: async (
                    _parent: any,
                    { input }: { input: Partial<T> & { id: string } },
                    context: Context,
                ) => {
                    return model.inContext(context).update(input.id, input);
                },
            },
        };
    }

    private static delete<T, Context>(model: Model<T>) {
        return {
            [`delete${model.name}`]: {
                type: deleteResponse,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }: { id: string }, context: Context) => {
                    await model.inContext(context).delete(id);
                    return { deleted: true, id };
                },
            },
        };
    }

    private static getOneEmbedded<T, Context>(model: Model<T>, property: Property) {
        const idKey = `${util.toCamelCase(model.name)}Id`;
        return {
            [`${util.toCamelCase(model.name)}${util.toPascalCase(util.singular(property.name))}`]: {
                type: Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput,
                args: {
                    [`${util.toCamelCase(model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                },
                resolve: async (_parent, { id, [idKey]: parentId }: any, context: Context) => {
                    return await model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .getOrThrow(id);
                },
            },
        };
    }

    private static getAllEmbedded<T, Context>(model: Model<T>, property: Property) {
        const idKey = `${util.toCamelCase(model.name)}Id`;
        return {
            [`all${model.name}${util.plural(property.getEmbeddedModelDefinition().name)}`]: {
                type: new graphql.GraphQLList(Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput),
                args: {
                    [idKey]: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                },
                resolve: async (_parent, { [idKey]: parentId }: any, context: Context) => {
                    return await model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .getAll();
                },
            },
        };
    }

    private static updateEmbedded<T, Context>(model: Model<T>, property: Property) {
        const idKey = `${util.toCamelCase(model.name)}Id`;
        return {
            [`update${model.name}${util.toPascalCase(util.singular(property.name))}`]: {
                type: Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput,
                args: {
                    [`${util.toCamelCase(model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    input: {
                        type: new graphql.GraphQLNonNull(
                            Typer.get(property.getEmbeddedModelDefinition()).update,
                        ),
                    },
                },
                resolve: async (_parent, { [idKey]: parentId, input }: any, context: Context) => {
                    return model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .update(input.id, input);
                },
            },
        };
    }

    private static createEmbedded<T, Context>(model: Model<T>, property: Property) {
        const idKey = `${util.toCamelCase(model.name)}Id`;
        return {
            [`create${model.name}${util.toPascalCase(util.singular(property.name))}`]: {
                type: Typer.get(property.getEmbeddedModelDefinition()).nonNullOutput,
                args: {
                    [`${util.toCamelCase(model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    input: {
                        type: new graphql.GraphQLNonNull(
                            Typer.get(property.getEmbeddedModelDefinition()).create,
                        ),
                    },
                },
                resolve: async (_parent, { [idKey]: parentId, input }: any, context: Context) => {
                    return await model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .create(input);
                },
            },
        };
    }

    private static deleteEmbedded<T, Context>(model: Model<T>, property: Property) {
        const idKey = `${util.toCamelCase(model.name)}Id`;
        return {
            [`delete${model.name}${util.toPascalCase(util.singular(property.name))}`]: {
                type: deleteResponse,
                args: {
                    [`${util.toCamelCase(model.name)}Id`]: {
                        type: new graphql.GraphQLNonNull(graphql.GraphQLString),
                    },
                    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                },
                resolve: async (_parent, { id, [idKey]: parentId }: any, context: Context) => {
                    await model
                        .inContext(context)
                        .onProperty(property.name as any)
                        .withParent(parentId)
                        .delete(id);
                    return { deleted: true, id };
                },
            },
        };
    }
}
