import * as graphql from 'graphql';
import { Api } from '../type';
import { Model } from '../model';

export class PaginateApi<T, Context> implements Api {
    constructor(private model: Model<T>) {}

    public getEndpoint() {
        const key = `paginate${this.model.name}s`;
        return {
            [key]: {
                type: this.model.graphql.paginatedOutput,
                args: { skip: { type: graphql.GraphQLInt }, take: { type: graphql.GraphQLInt } },
                resolve: async (_parent, { skip = 0, take = 10 }, context: Context) => {
                    const result = await this.model.inContext(context).paginate(skip, take);
                    return result;
                },
            },
        };
    }
}
