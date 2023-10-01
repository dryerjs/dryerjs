import * as graphql from 'graphql';
import { Model } from './model';

const deleteResponse = new graphql.GraphQLObjectType({
    name: `DeleteResponse`,
    fields: {
        deleted: { type: new graphql.GraphQLNonNull(graphql.GraphQLBoolean) },
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
    },
});

export class ApiBuilder {
    public static build<T, Context>(model: Model<T>) {
        const queryFields = {
            ...this.getOne<T, Context>(model),
            ...this.paginate<T, Context>(model),
            ...this.getAll<T, Context>(model),
        };
        const mutationFields = {
            ...this.create<T, Context>(model),
            ...this.update<T, Context>(model),
            ...this.delete<T, Context>(model),
        };
        return {
            queryFields,
            mutationFields,
        };
    }

    private static getOne<T, Context>(model: Model<T>) {
        const lowercaseName = model.name.replace(model.name[0], model.name[0].toLowerCase());
        return {
            [lowercaseName]: {
                type: model.graphql.nonNullOutput,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }: { id: string }, context: Context) => {
                    return model.inContext(context).getOrThrow(id);
                },
            },
        };
    }

    private static getAll<T, Context>(model: Model<T>) {
        return {
            [`all${model.name}s`]: {
                type: new graphql.GraphQLList(model.graphql.nonNullOutput),
                resolve: async (_parent, _, context: Context) => {
                    const items = await model.inContext(context).getAll();
                    return items;
                },
            },
        };
    }

    private static paginate<T, Context>(model: Model<T>) {
        return {
            [`paginate${model.name}s`]: {
                type: model.graphql.paginatedOutput,
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
                type: model.graphql.nonNullOutput,
                args: { input: { type: new graphql.GraphQLNonNull(model.graphql.create) } },
                resolve: async (_parent: any, { input }: { input: Partial<T> }, context: Context) => {
                    return model.inContext(context).create(input);
                },
            },
        };
    }

    private static update<T, Context>(model: Model<T>) {
        return {
            [`update${model.name}`]: {
                type: model.graphql.nonNullOutput,
                args: {
                    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                    input: { type: new graphql.GraphQLNonNull(model.graphql.update) },
                },
                resolve: async (
                    _parent: any,
                    { input, id }: { input: Partial<T>; id: string },
                    context: Context,
                ) => {
                    return model.inContext(context).update(id, input);
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
}
