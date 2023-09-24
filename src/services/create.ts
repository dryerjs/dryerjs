import { CachedPropertiesByModel, MetadataKey } from '../metadata';
import { Model } from '../type';
import { OutputService } from './output';

export class CreateService {
    public static async create(input: any, context: any, model: Model<any>) {
        await this.validate(input, context, model);
        const defaultAppliedInput = await this.setDefault(input, context, model);
        const transformedInput = await this.transform(defaultAppliedInput, context, model);
        const value = model.db.create(transformedInput);
        return OutputService.output(value, context, model);
    }

    private static async validate(input: any, context: any, model: Model<any>) {
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            model.name,
            MetadataKey.Validate,
        ) || {}) {
            if (input[property] === undefined) continue;
            const validateFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.Validate,
                property,
            );
            if (!validateFn) continue;
            await validateFn(input[property], context, input);
        }
    }

    private static async setDefault(input: any, context: any, model: Model<any>) {
        const properties = {};
        [MetadataKey.DefaultOnCreate, MetadataKey.DefaultOnInput].forEach(metaKey => {
            Object.keys(CachedPropertiesByModel.getPropertiesByModel(model.name, metaKey)).forEach(
                (property: string) => {
                    properties[property] = true;
                },
            );
        });

        for (const property in properties) {
            if (input[property] !== null && input[property] !== undefined) continue;
            const defaultOnCreateFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.DefaultOnCreate,
                property,
            );
            const defaultOnInputFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.DefaultOnInput,
                property,
            );
            const defaultFn = defaultOnCreateFn || defaultOnInputFn;
            if (!defaultFn) continue;
            input[property] = await defaultFn(context, input);
        }
        return input;
    }

    private static async transform(input: any, context: any, model: Model<any>) {
        const properties = {};
        [MetadataKey.TransformOnCreate, MetadataKey.TransformOnInput].forEach(metaKey => {
            Object.keys(CachedPropertiesByModel.getPropertiesByModel(model.name, metaKey)).forEach(
                (property: string) => {
                    properties[property] = true;
                },
            );
        });

        for (const property in properties) {
            if (input[property] === undefined) continue;
            const transformOnCreateFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.TransformOnCreate,
                property,
            );
            const transformOnInputFn = CachedPropertiesByModel.getMetadataValue(
                model.name,
                MetadataKey.TransformOnInput,
                property,
            );
            const transformFn = transformOnCreateFn || transformOnInputFn;
            if (!transformFn) continue;
            input[property] = await transformFn(input[property], context, input);
        }
        return input;
    }
}
