import * as graphql from 'graphql';
import { Api, Model } from '../type';

export class GetApi implements Api {
    constructor(private model: Model<any>) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0].toLowerCase());
        return {
            [key]: {
                type: this.model.graphql.output,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }, context: any) => {
                    return this.model.inContext(context).getOrThrow(id);
                },
            },
        };
    }
}
