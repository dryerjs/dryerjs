import * as graphql from 'graphql';
import { Api } from '../type';
import { Model } from '../model';

export class GetApi<T, Context> implements Api {
    constructor(private model: Model<T>) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0].toLowerCase());
        return {
            [key]: {
                type: this.model.graphql.nonNullOutput,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }: { id: string }, context: Context) => {
                    return this.model.inContext(context).getOrThrow(id);
                },
            },
        };
    }
}
