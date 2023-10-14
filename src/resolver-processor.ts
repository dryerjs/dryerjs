import { ReflectiveInjector } from 'injection-js';
import * as graphql from 'graphql';
import { GraphQLString, GraphQLFloat, GraphQLBoolean } from 'graphql';
import { GraphQLFieldConfigMap, TargetClass } from './shared';
import { MetaKey } from './metadata';
import { inspect } from './inspect';
import { Typer } from './typer';

export class ResolverProcessor {
    public static get(resolver: TargetClass, injector: ReflectiveInjector) {
        const queryFields: GraphQLFieldConfigMap = {};
        const mutationFields: GraphQLFieldConfigMap = {};

        for (const queryProperty of inspect(resolver).getProperties(MetaKey.Query)) {
            queryFields[queryProperty.name] = {
                type: graphql.GraphQLString,
                args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } },
                resolve: () => {
                    return 'hello';
                },
            };
        }

        for (const mutationProperty of inspect(resolver).getProperties(MetaKey.Mutation)) {
            const type = mutationProperty.getMetaValue(MetaKey.Mutation);
            const result = {
                type: Typer.get(type).output,
                args: {},
                resolve: (_parent, args, ctx) => {
                    const service = injector.get(resolver);
                    const definedArgs = mutationProperty
                        .getArgs()
                        .sort((a, b) => a.index - b.index)
                        .map(({ name }) => {
                            if (name === 'ctx') return ctx;
                            return args[name];
                        });

                    return service[mutationProperty.name](...definedArgs);
                },
            };

            const typeConfig = {
                String: GraphQLString,
                Date: GraphQLString,
                Number: GraphQLFloat,
                Boolean: GraphQLBoolean,
            };

            for (const arg of mutationProperty.getArgs()) {
                if (arg.name === 'ctx') continue;
                const isScalar = arg.type.name in typeConfig;
                if (isScalar) {
                    result.args[arg.name] = { type: typeConfig[arg.type.name] };
                    continue;
                }
                result.args[arg.name] = { type: Typer.get(arg.type).create };
            }
            mutationFields[mutationProperty.name] = result;
        }

        return {
            queryFields,
            mutationFields,
        };
    }
}
