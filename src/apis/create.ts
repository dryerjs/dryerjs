import { Api } from './type';

export class CreateApi implements Api {
    constructor(private model: any, private ctx: any) {}

    public getEndpoint() {
        return {
            [`create${this.model.name}`]: {
                type: this.model.graphql.output,
                args: { input: { type: this.model.graphql.create } },
                resolve: (_parent: any, { input }, _context: any) => {
                    return this.model.db.create(input);
                },
            },
        };
    }
}
