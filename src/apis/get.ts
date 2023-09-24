import * as graphql from 'graphql';
import { Api, Model } from '../type';
import { CachedPropertiesByModel, MetadataKey } from '../metadata';

export class GetApi implements Api {
    constructor(private model: Model<any>) {}

    public getEndpoint() {
        const key = this.model.name.replace(this.model.name[0], this.model.name[0].toLowerCase());
        return {
            [key]: {
                type: this.model.graphql.output,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
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
            if (!transformFn) continue;
            output[property] = await transformFn(output[property], context, output);
        }
        return output;
    }
}
