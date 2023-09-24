import * as graphql from 'graphql';
import { Api, Model } from '../type';

export class CreateApi implements Api {
    constructor(private model: Model<any>) {}

    public getEndpoint() {
        return {
            [`create${this.model.name}`]: {
                type: this.model.graphql.output,
                args: { input: { type: new graphql.GraphQLNonNull(this.model.graphql.create) } },
                resolve: async (_parent: any, { input }, context: any) => {
                    return this.model.inContext(context).create(input);
                },
            },
        };
    }
}
