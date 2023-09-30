import * as graphql from 'graphql';
import { Api } from '../type';
import { Model } from '../model';

export class UpdateApi<T, Context> implements Api {
    constructor(private model: Model<T>) {}

    public getEndpoint() {
        return {
            [`update${this.model.name}`]: {
                type: this.model.graphql.nonNullOutput,
                args: {
                    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
                    input: { type: new graphql.GraphQLNonNull(this.model.graphql.update) },
                },
                resolve: async (
                    _parent: any,
                    { input, id }: { input: Partial<T>; id: string },
                    context: Context,
                ) => {
                    return this.model.inContext(context).update(id, input);
                },
            },
        };
    }
}
