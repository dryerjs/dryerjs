import * as util from '../util';
import { MetaKey, inspect } from '../metadata';
import { ModelDefinition } from '../type';

export class ObjectProcessor {
    public static async validate<T, Context>({
        input,
        context,
        modelDefinition,
    }: {
        input: Partial<T>;
        context: Context;
        modelDefinition: ModelDefinition<T>;
    }) {
        for (const property of inspect(modelDefinition).getProperties(MetaKey.Validate)) {
            if (util.isUndefined(input[property.name])) continue;
            const validateFn = property.getMetaValue(MetaKey.Validate);
            await validateFn(input[property.name], context, input);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (util.isUndefined(input[property.name])) continue;
            await this.validate({
                input: input[property.name],
                context,
                modelDefinition: property.getEmbeddedModelDefinition(),
            });
        }
    }

    public static async setDefault<T, Context>(input: {
        obj: T;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        MetaKey: MetaKey;
    }): Promise<T> {
        return (await this.setDefaultPartial(input)) as T;
    }

    public static async setDefaultPartial<T, Context>(input: {
        obj: Partial<T>;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        MetaKey: MetaKey;
    }) {
        const { obj, context, modelDefinition, MetaKey } = input;
        for (const property of inspect(modelDefinition).getProperties(MetaKey)) {
            if (util.isNotNil(obj[property.name])) continue;
            const defaultFn = property.getMetaValue(MetaKey);
            obj[property.name] = await defaultFn(context, obj);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (util.isNil(obj[property.name])) continue;
            const embeddedValue = await this.setDefault({
                obj: obj[property.name],
                context,
                modelDefinition: property.getEmbeddedModelDefinition(),
                MetaKey,
            });
            obj[property.name] = embeddedValue;
        }
        return obj;
    }

    public static async transform<T, Context>(input: {
        obj: T;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        MetaKey: MetaKey;
    }): Promise<T> {
        return (await this.transformPartial(input)) as T;
    }

    public static async transformPartial<T, Context>(input: {
        obj: Partial<T>;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        MetaKey: MetaKey;
    }) {
        const { obj, context, modelDefinition, MetaKey } = input;
        for (const property of inspect(modelDefinition).getProperties(MetaKey)) {
            if (util.isNil(obj[property.name])) continue;
            const transformFn = property.getMetaValue(MetaKey);
            obj[property.name] = await transformFn(obj[property.name], context, obj);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (util.isNil(obj[property.name])) continue;
            const embeddedValue = await this.transform({
                obj: obj[property.name],
                context,
                modelDefinition: property.getEmbeddedModelDefinition(),
                MetaKey,
            });
            obj[property.name] = embeddedValue;
        }

        return obj;
    }
}
