import { Model } from '../model';
import { MetadataKey, inspect } from '../metadata';
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
        for (const property of inspect(modelDefinition).getProperties(MetadataKey.Validate)) {
            if (input[property.name] === undefined) continue;
            const validateFn = property.getMetadataValue(MetadataKey.Validate);
            await validateFn(input[property.name], context, input);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (input[property.name] === undefined) continue;
            await this.validate(input[property.name], context, property.getEmbeddedModelDefinition());
        }
    }

    private static async setDefault<T, Context>(
        input: Partial<T>,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property of inspect(modelDefinition).getProperties(MetadataKey.DefaultOnUpdate)) {
            if (input[property.name] !== null && input[property.name] !== undefined) continue;
            const defaultFn = property.getMetadataValue(MetadataKey.DefaultOnUpdate);
            input[property.name] = await defaultFn(context, input);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (input[property.name] === null || input[property.name] === undefined) continue;
            input[property.name] = await this.setDefault(
                input[property.name],
                context,
                property.getEmbeddedModelDefinition(),
            );
        }
        return input;
    }

    private static async transform<T, Context>(
        input: Partial<T>,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property of inspect(modelDefinition).getProperties(MetadataKey.TransformOnUpdate)) {
            if (input[property.name] === undefined) continue;
            const transformFn = property.getMetadataValue(MetadataKey.TransformOnUpdate);
            input[property.name] = await transformFn(input[property.name], context, input);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (input[property.name] === undefined) continue;
            input[property.name] = await this.transform(
                input[property.name],
                context,
                property.getEmbeddedModelDefinition(),
            );
        }

        return input;
    }
}
