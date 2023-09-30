import { Model } from '../model';
import { CachedPropertiesByModel, MetadataKey } from '../metadata';
import { OutputService } from './output';

export class UpdateService {
    public static async update<T, Context>(id: string, input: Partial<T>, context: Context, model: Model<T>) {
        await this.validate(input, context, model);
        const defaultAppliedInput = await this.setDefault(input, context, model);
        const transformedInput = await this.transform(defaultAppliedInput, context, model);
        const result = await model.db.findByIdAndUpdate(id, transformedInput, {
            new: true,
        });
        return OutputService.output(result, context, model);
    }

    private static async validate<T, Context>(input: Partial<T>, context: Context, model: Model<T>) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            model.name,
            MetadataKey.Validate,
        )) {
            if (input[property] === undefined) continue;
            const validateFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.Validate,
                property,
            );
            await validateFn(input[property], context, input);
        }
    }

    private static async setDefault<T, Context>(input: Partial<T>, context: Context, model: Model<T>) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            model.name,
            MetadataKey.DefaultOnUpdate,
        )) {
            if (input[property] !== null && input[property] !== undefined) continue;
            const defaultFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.DefaultOnUpdate,
                property,
            );
            input[property] = await defaultFn(context, input);
        }
        return input;
    }

    private static async transform<T, Context>(input: Partial<T>, context: Context, model: Model<T>) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            model.name,
            MetadataKey.TransformOnUpdate,
        )) {
            if (input[property] === undefined) continue;
            const transformFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.TransformOnUpdate,
                property,
            );
            input[property] = await transformFn(input[property], context, input);
        }
        return input;
    }
}
