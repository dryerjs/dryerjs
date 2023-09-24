import * as graphql from 'graphql';
import { Api } from './type';

const deleteResponse = new graphql.GraphQLObjectType({
    name: `DeleteResponse`,
    fields: {
        deleted: { type: graphql.GraphQLBoolean },
        id: { type: graphql.GraphQLString },
    },
});

export class DeleteApi implements Api {
    constructor(private model: any) {}

    public getEndpoint() {
        return {
            [`delete${this.model.name}`]: {
                type: deleteResponse,
                args: { id: { type: graphql.GraphQLString } },
                resolve: async (_parent, { id }, _context: any) => {
                    await this.model.db.findByIdAndDelete(id);
                    return { deleted: true, id };
                },
            },
        };
    }
}
