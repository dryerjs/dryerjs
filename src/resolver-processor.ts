import { ReflectiveInjector } from 'injection-js';
import { GraphQLString, GraphQLFloat, GraphQLBoolean } from 'graphql';
import { ApiOptions, GraphQLFieldConfigMap, TargetClass } from './shared';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { inspect } from './inspect';
import { Typer } from './typer';

export class ResolverProcessor {
    public static get(resolver: TargetClass, injector: ReflectiveInjector) {
        const queryFields: GraphQLFieldConfigMap = {};
        const mutationFields: GraphQLFieldConfigMap = {};

        for (const property of inspect(resolver).getProperties(MetaKey.Api)) {
            const apiOptions = property.getMetaValue(MetaKey.Api) as ApiOptions;
            const type = (() => {
                if (util.isFunction(apiOptions.type)) return apiOptions.type;
                return Metadata.getModelMetaValue(resolver, MetaKey.Resolver);
            })();

            if (!util.isFunction(type)) {
                throw new Error(`Unable to determine type for ${resolver.name}.${property.name}`);
            }

            const result = {
                type: Typer.get(type).output,
                args: {},
                resolve: (_parent, args, ctx) => {
                    const service = injector.get(resolver);
                    const definedArgs = property
                        .getArgs()
                        .sort((a, b) => a.index - b.index)
                        .map(({ name }) => {
                            if (name === 'ctx') return ctx;
                            return args[name];
                        });

                    return service[property.name](...definedArgs);
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
                    result.args[arg.name] = { type: typeConfig[arg.type.name] };
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
