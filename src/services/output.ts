import { Model } from '../model';
import { CachedPropertiesByModel, MetadataKey } from '../metadata';
import { ModelDefinition } from '../type';

export class OutputService {
    public static async output<T, Context>(rawValue: T | null, context: Context, model: Model<T>) {
        if (!rawValue) return null;
        const leanValue = rawValue['toObject'] ? rawValue['toObject']() : rawValue;
        if (!leanValue.id && leanValue._id) {
            leanValue.id = leanValue._id.toString();
        }
        const defaultAppliedResult = await this.setDefault(leanValue, context, model.definition);
        return await this.transform(defaultAppliedResult, context, model.definition);
    }

    private static async setDefault<T, Context>(
        output: T,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.DefaultOnOutput,
        )) {
            if (output[property] !== null && output[property] !== undefined) continue;
            const defaultFn = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.DefaultOnOutput,
                property,
            );
            output[property] = await defaultFn(output[property], context, output);
        }

        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.Embedded,
        )) {
            if (output[property] === null || output[property] === undefined) continue;
            const embeddedModelDefinition = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Embedded,
                property,
            );
            const embeddedValue = await this.setDefault(output[property], context, embeddedModelDefinition);
            output[property] = embeddedValue;
        }

        return output;
    }

    private static async transform<T, Context>(
        output: T,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.TransformOnOutput,
        )) {
            if (output[property] === null && output[property] === undefined) continue;
            const transformFn = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.TransformOnOutput,
                property,
            );
            output[property] = await transformFn(output[property], context, output);
        }

        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.Embedded,
        )) {
            if (output[property] === null || output[property] === undefined) continue;
            const embeddedModelDefinition = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Embedded,
                property,
            );
            const embeddedValue = await this.transform(output[property], context, embeddedModelDefinition);
            output[property] = embeddedValue;
        }

        return output;
    }
}
