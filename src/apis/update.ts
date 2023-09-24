import * as graphql from 'graphql';
import { Api, Model } from '../type';
import { CachedPropertiesByModel, MetadataKey } from '../property';

export class UpdateApi implements Api {
    constructor(private model: Model<any>) {}

    public getEndpoint() {
        return {
            [`update${this.model.name}`]: {
                type: this.model.graphql.output,
                args: { id: { type: graphql.GraphQLString }, input: { type: this.model.graphql.update } },
                resolve: async (_parent: any, { input, id }, context: any) => {
                    await this.validate(input, context);
                    const transformedInput = await this.transform(input, context);
                    const result = await this.model.db.findByIdAndUpdate(id, transformedInput, {
                        new: true,
                    });
                    return result;
                },
            },
        };
    }

    private async validate(input: any, context: any) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            this.model.name,
            MetadataKey.Validate,
        ) || {}) {
            if (input[property] === undefined) continue;
            const validateFn = CachedPropertiesByModel.getMetadataValue(
                this.model.name,
                MetadataKey.Validate,
                property,
            );
            if (!validateFn) continue;
            await validateFn(input, input[property], context);
        }
    }

    private async transform(input: any, context: any) {
        const properties = {};
        [MetadataKey.TransformOnCreate, MetadataKey.TransformOnInput].forEach(metaKey => {
            Object.keys(CachedPropertiesByModel.getPropertiesByModel(this.model.name, metaKey)).forEach(
                (property: string) => {
                    properties[property] = true;
                },
            );
        });

        for (const property in properties) {
            if (input[property] === undefined) continue;
            const transformOnCreateFn = CachedPropertiesByModel.getMetadataValue(
                this.model.name,
                MetadataKey.TransformOnCreate,
                property,
            );
            const transformOnInputFn = CachedPropertiesByModel.getMetadataValue(
                this.model.name,
                MetadataKey.TransformOnInput,
                property,
            );
            const transformFn = transformOnCreateFn || transformOnInputFn;
            if (!transformFn) continue;
            input[property] = await transformFn(input, input[property], context);
        }
        return input;
    }
}
