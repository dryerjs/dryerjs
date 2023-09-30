import * as graphql from 'graphql';
import { Api } from '../type';
import { Model } from '../model';

const deleteResponse = new graphql.GraphQLObjectType({
    name: `DeleteResponse`,
    fields: {
        deleted: { type: new graphql.GraphQLNonNull(graphql.GraphQLBoolean) },
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
    },
});

export class DeleteApi<T, Context> implements Api {
    constructor(private model: Model<T>) {}

    public getEndpoint() {
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
}
