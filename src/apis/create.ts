import * as graphql from 'graphql';
import { Api } from '../type';
import { Model } from '../model';

export class CreateApi<T, Context> implements Api {
    constructor(private model: Model<T>) {}

    public getEndpoint() {
        return {
            [`create${this.model.name}`]: {
                type: this.model.graphql.nonNullOutput,
                args: { input: { type: new graphql.GraphQLNonNull(this.model.graphql.create) } },
                resolve: async (_parent: any, { input }: { input: Partial<T> }, context: Context) => {
                    return this.model.inContext(context).create(input);
                },
            },
        };
    }
}
