import * as graphql from 'graphql';
import { Api } from '../type';
import { Model } from '../model';

export class ListApi<T, Context> implements Api {
    constructor(private model: Model<T>) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0].toLowerCase()).concat('s');
        return {
            [key]: {
                type: new graphql.GraphQLList(this.model.graphql.nonNullOutput),
                args: { skip: { type: graphql.GraphQLInt }, take: { type: graphql.GraphQLInt } },
                resolve: async (_parent, { skip, take }, context: Context) => {
                    const result = await this.model.inContext(context).list(skip, take);
                    return result;
                },
            },
        };
    }
}
