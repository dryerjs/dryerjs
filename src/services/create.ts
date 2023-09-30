import { inspect, MetadataKey } from '../metadata';
import { ModelDefinition } from '../type';
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
        for (const property of inspect(modelDefinition).getProperties(MetadataKey.DefaultOnCreate)) {
            if (input[property.name] !== null && input[property.name] !== undefined) continue;
            const defaultFn = property.getMetadataValue(MetadataKey.DefaultOnCreate);
            input[property.name] = await defaultFn(context, input);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (input[property.name] === undefined) continue;
            const embeddedValue = await this.setDefault(
                input[property.name],
                context,
                property.getEmbeddedModelDefinition(),
            );
            input[property.name] = embeddedValue;
        }
        return input;
    }

    private static async transform<T, Context>(
        input: Partial<T>,
        context: Context,
        modelDefinition: ModelDefinition<T>,
    ) {
        for (const property of inspect(modelDefinition).getProperties(MetadataKey.TransformOnCreate)) {
            if (input[property.name] === null || input[property.name] === undefined) continue;
            const transformFn = property.getMetadataValue(MetadataKey.TransformOnCreate);
            input[property.name] = await transformFn(input[property.name], context, input);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (input[property.name] === null || input[property.name] === undefined) continue;
            const embeddedValue = await this.transform(
                input[property.name],
                context,
                property.getEmbeddedModelDefinition(),
            );
            input[property.name] = embeddedValue;
        }

        return input;
    }
}
