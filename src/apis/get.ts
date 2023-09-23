import * as graphql from 'graphql';
import { Api } from './type';

export class GetApi implements Api {
    constructor(private model: any, private ctx: any) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0].toLowerCase());
        return {
            [key]: {
                type: this.model.graphql.output,
                args: { id: { type: graphql.GraphQLString } },
                resolve: async (_parent, { id }, _context: any) => {
                    const result = await this.model.db.findById(id);
                    return result;
                },
            },
        };
    }
}
