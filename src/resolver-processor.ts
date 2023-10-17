import { ReflectiveInjector } from 'injection-js';
import { GraphQLString, GraphQLFloat, GraphQLBoolean, GraphQLNonNull } from 'graphql';
import { ApiOptions, GraphQLFieldConfigMap, TargetClass } from './shared';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { inspect } from './inspect';
import { Typer } from './typer';
import { OutputService } from './services';
import { ObjectMarker } from './object-marker';

export class ResolverProcessor {
    public static get(resolver: TargetClass, injector: ReflectiveInjector) {
        const queryFields: GraphQLFieldConfigMap = {};
        const mutationFields: GraphQLFieldConfigMap = {};

        for (const property of inspect(resolver).getProperties(MetaKey.Api)) {
            const apiOptions = property.getMetaValue(MetaKey.Api) as ApiOptions;
            const type = (() => {
                if (!util.isNil(apiOptions.type)) return apiOptions.type;
                return Metadata.getModelMetaValue(resolver, MetaKey.Resolver);
            })();

            /* istanbul ignore if */
            if (util.isNil(type)) {
                throw new Error(`Unable to determine type for ${resolver.name}.${property.name}`);
            }

            const result = {
                type: util.isFunction(type) ? Typer.get(type).output : type,
                args: {},
                resolve: async (_parent, args, ctx) => {
                    const service = injector.get(resolver);
                    const definedArgs = property
                        .getArgs()
                        .sort((a, b) => a.index - b.index)
                        .map(({ name }) => {
                            if (name === 'ctx') return ctx;
                            return args[name];
                        });

                    const result = await service[property.name](...definedArgs);
                    if (ObjectMarker.isProcessed(result)) return result;
                    try {
                        return await OutputService.output(result, ctx, type);
                    } catch (error) {
                        return result;
                    }
                },
            };

            const typeConfig = {
                String: GraphQLString,
                Date: GraphQLString,
                Number: GraphQLFloat,
                Boolean: GraphQLBoolean,
            };

            for (const arg of property.getArgs()) {
                if (arg.name === 'ctx') continue;
                const isScalar = arg.type.name in typeConfig;
                if (isScalar) {
                    result.args[arg.name] = arg.required
                        ? { type: new GraphQLNonNull(typeConfig[arg.type.name]) }
                        : { type: typeConfig[arg.type.name] };
                    continue;
                }
                result.args[arg.name] = { type: Typer.get(arg.type).create };
            }

            if (apiOptions.kind === 'Query') queryFields[property.name] = result;
            if (apiOptions.kind === 'Mutation') mutationFields[property.name] = result;
        }

        return {
            queryFields,
            mutationFields,
        };
    }
}
