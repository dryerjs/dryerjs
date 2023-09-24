import * as graphql from 'graphql';
import { Api } from './type';
import { CachedPropertiesByModel, MetadataKey } from '../property';

export class GetApi implements Api {
    constructor(private model: any) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0].toLowerCase());
        return {
            [key]: {
                type: this.model.graphql.output,
                args: { id: { type: graphql.GraphQLString } },
                resolve: async (_parent, { id }, context: any) => {
                    const result = await this.model.db.findById(id);
                    if (!result) throw new Error(`No ${this.model.name} found with id ${id}`);
                    return await this.transform(result, context);
                },
            },
        };
    }

    private async transform(output: any, context: any) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            this.model.name,
            MetadataKey.TransformOnOutput,
        ) || {}) {
            const transformFn = CachedPropertiesByModel.getMetadataValue(
                this.model.name,
                MetadataKey.TransformOnOutput,
                property,
            );
            console.log('transformFn', transformFn, property);
            if (!transformFn) {
                continue;
            }
            output[property] = await transformFn(output, output[property], context);
        }
        return output;
    }
}
