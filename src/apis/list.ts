import * as graphql from 'graphql';
import { Api, Model } from '../type';

export class ListApi implements Api {
    constructor(private model: Model<any>) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0].toLowerCase()).concat('s');
        return {
            [key]: {
                type: new graphql.GraphQLList(this.model.graphql.output),
                args: { skip: { type: graphql.GraphQLInt }, take: { type: graphql.GraphQLInt } },
                resolve: async (_parent, { skip, take }, context: any) => {
                    const result = await this.model.inContext(context).list(skip, take);
                    return result;
                },
            },
        };
    }
}
