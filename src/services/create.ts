import { ModelDefinition } from '../type';
import { CachedPropertiesByModel, MetadataKey } from '../metadata';
import { Model } from '../model';
import { OutputService } from './output';

export class CreateService {
    public static async create<T, Context>(input: Partial<T>, context: Context, model: Model<T>) {
        await this.validate(input, context, model.definition);
        const defaultAppliedInput = await this.setDefault(input, context, model.definition);
        const transformedInput = await this.transform(defaultAppliedInput, context, model.definition);
        const value = await model.db.create(transformedInput);
        return OutputService.output(value, context, model);
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
            MetadataKey.DefaultOnCreate,
        )) {
            if (input[property] !== null && input[property] !== undefined) continue;
            const defaultFn = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.DefaultOnCreate,
                property,
            );
            input[property] = await defaultFn(context, input);
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
            const embeddedValue = await this.setDefault(input[property], context, embeddedModelDefinition);
            input[property] = embeddedValue;
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
            MetadataKey.TransformOnCreate,
        )) {
            if (input[property] === null || input[property] === undefined) continue;
            const transformFn = CachedPropertiesByModel.getMetadataValue(
                modelDefinition.name,
                MetadataKey.TransformOnCreate,
                property,
            );
            input[property] = await transformFn(input[property], context, input);
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
            const embeddedValue = await this.transform(input[property], context, embeddedModelDefinition);
            input[property] = embeddedValue;
        }

        return input;
    }
}
