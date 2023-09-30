import * as graphql from 'graphql';
import { Api } from '../type';
import { Model } from '../model';

export class GetAllApi<T, Context> implements Api {
    constructor(private model: Model<T>) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0]).concat('s');
        return {
            [`all${key}`]: {
                type: new graphql.GraphQLList(this.model.graphql.nonNullOutput),
                resolve: async (_parent, _, context: Context) => {
                    const items = await this.model.inContext(context).getAll();
                    return items;
                },
            },
        };
    }
}
