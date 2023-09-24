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
                    const defaultAppliedResult = await this.setDefault(result, context);
                    return await this.transform(defaultAppliedResult, context);
                },
            },
        };
    }

    private async setDefault(output: any, context: any) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            this.model.name,
            MetadataKey.DefaultOnOutput,
        ) || {}) {
            if (output[property] !== null && output[property] !== undefined) continue;
            const defaultFn = CachedPropertiesByModel.getMetadataValue(
                this.model.name,
                MetadataKey.DefaultOnOutput,
                property,
            );
            if (!defaultFn) continue;
            output[property] = await defaultFn(output[property], context, output);
        }
        return output;
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
