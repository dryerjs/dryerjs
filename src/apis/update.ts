import * as graphql from 'graphql';
import { Api } from './type';

export class UpdateApi implements Api {
    constructor(private model: any, private ctx: any) {}

    public getEndpoint() {
        return {
            [`update${this.model.name}`]: {
                type: this.model.graphql.output,
                args: { id: { type: graphql.GraphQLString }, input: { type: this.model.graphql.update } },
                resolve: async (_parent: any, { input, id }, _context: any) => {
                    const result = await this.model.db.findByIdAndUpdate(id, input);
                    return result;
                },
            },
        };
    }
}
