import { Model } from '../model';
import { MetadataKey, inspect } from '../metadata';
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
        for (const property of inspect(modelDefinition).getProperties(MetadataKey.DefaultOnOutput)) {
            if (output[property.name] !== null && output[property.name] !== undefined) continue;
            const defaultFn = property.getMetadataValue(MetadataKey.DefaultOnOutput);
            output[property.name] = await defaultFn(output[property.name], context, output);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (output[property.name] === null || output[property.name] === undefined) continue;
            const embeddedValue = await this.setDefault(
                output[property.name],
                context,
                property.getEmbeddedModelDefinition(),
            );
            output[property.name] = embeddedValue;
        }

        return output;
    }

    private static async transform<T, Context>(
        output: T,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property of inspect(modelDefinition).getProperties(MetadataKey.TransformOnOutput)) {
            if (output[property.name] === null && output[property.name] === undefined) continue;
            const transformFn = property.getMetadataValue(MetadataKey.TransformOnOutput);
            output[property.name] = await transformFn(output[property.name], context, output);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (output[property.name] === null || output[property.name] === undefined) continue;
            const embeddedValue = await this.transform(
                output[property.name],
                context,
                property.getEmbeddedModelDefinition(),
            );
            output[property.name] = embeddedValue;
        }

        return output;
    }
}
