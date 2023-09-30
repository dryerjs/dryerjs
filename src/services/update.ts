import { Model } from '../model';
import { CachedPropertiesByModel, MetadataKey } from '../metadata';
import { OutputService } from './output';
import { ModelDefinition } from '../type';

export class UpdateService {
    public static async update<T, Context>(id: string, input: Partial<T>, context: Context, model: Model<T>) {
        await this.validate(input, context, model.definition);
        const defaultAppliedInput = await this.setDefault(input, context, model.definition);
        const transformedInput = await this.transform(defaultAppliedInput, context, model.definition);
        const result = await model.db.findByIdAndUpdate(id, transformedInput, {
            new: true,
        });
        return OutputService.output(result, context, model);
    }

    private static async validate<T, Context>(
        input: Partial<T>,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.Validate,
        )) {
            if (input[property] === undefined) continue;
            const validateFn = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Validate,
                property,
            );
            await validateFn(input[property], context, input);
        }

        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.Embedded,
        )) {
            if (input[property] === undefined) continue;
            const embeddedModelDefinition = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Embedded,
                property,
            );
            await this.validate(input[property], context, embeddedModelDefinition);
        }
    }

    private static async setDefault<T, Context>(
        input: Partial<T>,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.DefaultOnUpdate,
        )) {
            if (input[property] !== null && input[property] !== undefined) continue;
            const defaultFn = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.DefaultOnUpdate,
                property,
            );
            input[property] = await defaultFn(context, input);
        }

        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.Embedded,
        )) {
            if (input[property] === null || input[property] === undefined) continue;
            const embeddedModelDefinition = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Embedded,
                property,
            );
            input[property] = await this.setDefault(input[property], context, embeddedModelDefinition);
        }
        return input;
    }

    private static async transform<T, Context>(
        input: Partial<T>,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.TransformOnUpdate,
        )) {
            if (input[property] === undefined) continue;
            const transformFn = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.TransformOnUpdate,
                property,
            );
            input[property] = await transformFn(input[property], context, input);
        }

        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            modelDefinition.name,
            MetadataKey.Embedded,
        )) {
            if (input[property] === undefined) continue;
            const embeddedModelDefinition = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.Embedded,
                property,
            );
            input[property] = await this.transform(input[property], context, embeddedModelDefinition);
        }

        return input;
    }
}
