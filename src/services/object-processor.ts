import * as graphql from 'graphql';
import * as util from '../util';
import * as must from './must';
import { MetaKey } from '../metadata';
import { ModelDefinition, RelationKind } from '../shared';
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

        for (const property of inspect(modelDefinition).getRelationProperties()) {
            const relation = property.getRelation();
            const relationModel = context.dryer.model(property.getRelationModelDefinition());
            if (relation.kind === RelationKind.BelongsTo) {
                if (util.isUndefined(input[relation.from])) continue;
                must.found(
                    await relationModel.db.exists({ _id: input[relation.from] }),
                    relationModel,
                    input[relation.from],
                );
                continue;
            }
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

    public static lean<T>(input: { obj: Partial<T>; modelDefinition: ModelDefinition<T> }) {
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
