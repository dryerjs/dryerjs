import { Model } from '../type';
import { CachedPropertiesByModel, MetadataKey } from '../metadata';

export class OutputService {
    public static async output(rawValue: any, context: any, model: Model<any>) {
        if (!rawValue) return null;
        const defaultAppliedResult = await this.setDefault(rawValue, context, model);
        return await this.transform(defaultAppliedResult, context, model);
    }

    private static async setDefault(output: any, context: any, model: Model<any>) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            model.name,
            MetadataKey.DefaultOnOutput,
        ) || {}) {
            if (output[property] !== null && output[property] !== undefined) continue;
            const defaultFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.DefaultOnOutput,
                property,
            );
            if (!defaultFn) continue;
            output[property] = await defaultFn(output[property], context, output);
        }
        return output;
    }

    private static async transform(output: any, context: any, model: Model<any>) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            model.name,
            MetadataKey.TransformOnOutput,
        ) || {}) {
            const transformFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.TransformOnOutput,
                property,
            );
            if (!transformFn) continue;
            output[property] = await transformFn(output[property], context, output);
        }
        return output;
    }
}
