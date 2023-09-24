import * as graphql from 'graphql';
import { Api, Model } from '../type';

const deleteResponse = new graphql.GraphQLObjectType({
    name: `DeleteResponse`,
    fields: {
        deleted: { type: new graphql.GraphQLNonNull(graphql.GraphQLBoolean) },
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
    },
});

export class DeleteApi implements Api {
    constructor(private model: Model<any>) {}

    public getEndpoint() {
        return {
            [`delete${this.model.name}`]: {
                type: deleteResponse,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: async (_parent, { id }, _context: any) => {
                    await this.model.db.findByIdAndDelete(id);
                    return { deleted: true, id };
                },
            },
        };
    }
}
