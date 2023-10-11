import * as util from '../util';
import { MetaKey } from '../metadata';
import { ModelDefinition } from '../shared';
import { inspect } from '../inspect';
import { BaseContext } from '../dryer';

export class ObjectProcessor {
    public static async validate<T, Context extends BaseContext>({
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
            if (property.isArray()) {
                await Promise.all(
                    input[property.name].map((item: any) =>
                        this.validate({
                            input: item,
                            context,
                            modelDefinition: property.getEmbeddedModelDefinition(),
                        }),
                    ),
                );
                continue;
            }
            await this.validate({
                input: input[property.name],
                context,
                modelDefinition: property.getEmbeddedModelDefinition(),
            });
        }
    }

    public static async setDefault<T, Context extends BaseContext>(input: {
        obj: T;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        metaKey: MetaKey;
    }): Promise<T> {
        return (await this.setDefaultPartial(input)) as T;
    }

    public static async setDefaultPartial<T, Context extends BaseContext>(input: {
        obj: Partial<T>;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        metaKey: MetaKey;
    }) {
        const { obj, context, modelDefinition, metaKey } = input;
        for (const property of inspect(modelDefinition).getProperties(metaKey)) {
            if (util.isNotNil(obj[property.name])) continue;
            const defaultFn = property.getMetaValue(metaKey);
            obj[property.name] = await defaultFn(context, obj);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (util.isNil(obj[property.name])) continue;
            if (property.isArray()) {
                const embeddedValue = await Promise.all(
                    obj[property.name].map((item: any) =>
                        this.setDefault({
                            obj: item,
                            context,
                            modelDefinition: property.getEmbeddedModelDefinition(),
                            metaKey,
                        }),
                    ),
                );
                obj[property.name] = embeddedValue;
                continue;
            }
            const embeddedValue = await this.setDefault({
                obj: obj[property.name],
                context,
                modelDefinition: property.getEmbeddedModelDefinition(),
                metaKey,
            });
            obj[property.name] = embeddedValue;
        }
        return obj;
    }

    public static async transform<T, Context extends BaseContext>(input: {
        obj: T;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        metaKey: MetaKey;
    }): Promise<T> {
        return (await this.transformPartial(input)) as T;
    }

    public static async transformPartial<T, Context extends BaseContext>(input: {
        obj: Partial<T>;
        context: Context;
        modelDefinition: ModelDefinition<T>;
        metaKey: MetaKey;
    }) {
        const { obj, context, modelDefinition, metaKey } = input;
        for (const property of inspect(modelDefinition).getProperties(metaKey)) {
            if (util.isNil(obj[property.name])) continue;
            const transformFn = property.getMetaValue(metaKey);
            obj[property.name] = await transformFn(obj[property.name], context, obj);
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (util.isNil(obj[property.name])) continue;
            if (property.isArray()) {
                const embeddedValue = await Promise.all(
                    obj[property.name].map((item: any) =>
                        this.transform({
                            obj: item,
                            context,
                            modelDefinition: property.getEmbeddedModelDefinition(),
                            metaKey,
                        }),
                    ),
                );
                obj[property.name] = embeddedValue;
                continue;
            }
            const embeddedValue = await this.transform({
                obj: obj[property.name],
                context,
                modelDefinition: property.getEmbeddedModelDefinition(),
                metaKey,
            });
            obj[property.name] = embeddedValue;
        }

        return obj;
    }
}
