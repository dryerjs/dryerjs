import { Injectable } from 'injection-js';
import * as util from '../util';
import { MetaKey } from '../metadata';
import { ModelDefinition } from '../shared';
import { inspect } from '../inspect';
import { Context } from '../dryer';

@Injectable()
export class ObjectProcessor<T, ExtraContext> {
    public async validate({
        input,
        context,
        modelDefinition,
    }: {
        input: Partial<T>;
        context: Context<ExtraContext>;
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

    public async setDefault(input: {
        obj: T;
        context: Context<ExtraContext>;
        modelDefinition: ModelDefinition<T>;
        metaKey: MetaKey;
    }): Promise<T> {
        return (await this.setDefaultPartial(input)) as T;
    }

    public lean(input: { obj: Partial<T>; modelDefinition: ModelDefinition<T> }) {
        const { obj, modelDefinition } = input;

        const leanObject = util.isFunction(obj['toObject']) ? obj['toObject']() : obj;
        if (util.isNil(leanObject.id) && util.isTruthy(leanObject._id)) {
            leanObject.id = leanObject._id.toString();
        }

        for (const property of inspect(modelDefinition).getEmbeddedProperties()) {
            if (util.isNil(obj[property.name])) continue;
            if (property.isArray()) {
                leanObject[property.name] = leanObject[property.name].map((item: any) =>
                    this.lean({
                        obj: item,
                        modelDefinition: property.getEmbeddedModelDefinition(),
                    }),
                );
            }
            leanObject[property.name] = this.lean({
                obj: leanObject[property.name],
                modelDefinition: property.getEmbeddedModelDefinition(),
            });
        }

        return leanObject;
    }

    public async setDefaultPartial(input: {
        obj: Partial<T>;
        context: Context<ExtraContext>;
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
                        this.setDefaultPartial({
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
            const embeddedValue = await this.setDefaultPartial({
                obj: obj[property.name],
                context,
                modelDefinition: property.getEmbeddedModelDefinition(),
                metaKey,
            });
            obj[property.name] = embeddedValue;
        }
        return obj;
    }

    public async transform(input: {
        obj: T;
        context: Context<ExtraContext>;
        modelDefinition: ModelDefinition<T>;
        metaKey: MetaKey;
    }): Promise<T> {
        return (await this.transformPartial(input)) as T;
    }

    public async transformPartial(input: {
        obj: Partial<T>;
        context: Context<ExtraContext>;
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
                        this.transformPartial({
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
            const embeddedValue = await this.transformPartial({
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
