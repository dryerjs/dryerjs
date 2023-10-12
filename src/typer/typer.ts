import {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLBoolean,
    GraphQLInt,
    GraphQLList,
} from 'graphql';
import * as util from '../util';
import { ModelDefinition } from '../shared';
import { Property } from '../property';
import { OutputTypeBuilder } from './output';
import { CreateInputTypeBuilder } from './create';
import { UpdateInputTypeBuilder } from './update';
import { FilterableInputTypeBuilder } from './filter';

const cacheKey = Symbol('typer');

export class Typer {
    public static get(modelDefinition: ModelDefinition) {
        if (modelDefinition[cacheKey]) return modelDefinition[cacheKey] as ReturnType<typeof Typer.build>;
        const result = this.build(modelDefinition);
        modelDefinition[cacheKey] = result;
        return result;
    }

    public static getCreateInputForBelongingModel(modelDefinition: ModelDefinition, property: Property) {
        const { create } = this.get(modelDefinition);
        const result = {
            name: `Create${modelDefinition.name}InputInside${property.modelDefinition.name}`,
            fields: {},
        };

        const originalFields = util.isFunction(create['_fields']) ? create['_fields']() : create['_fields'];

        for (const key of Object.keys(originalFields)) {
            if (key === property.getRelation().to) continue;
            result.fields[key] = originalFields[key];
        }

        return new GraphQLInputObjectType(result);
    }

    private static build(modelDefinition: ModelDefinition) {
        const output = new OutputTypeBuilder(modelDefinition).getType() as GraphQLObjectType;
        const create = new CreateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        const update = new UpdateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        const filterable = new FilterableInputTypeBuilder(modelDefinition).getType();
        const nonNullOutput = new GraphQLNonNull(output);
        const result = {
            output,
            nonNullOutput,
            create,
            update,
            filterable,
            paginatedOutput: this.getPaginatedOutputType(modelDefinition, nonNullOutput),
        };
        return result;
    }

    private static getPaginatedOutputType(
        modelDefinition: ModelDefinition,
        nonNullOutput: GraphQLNonNull<GraphQLObjectType<ModelDefinition, any>>,
    ) {
        const result = {
            name: `Paginated${util.plural(modelDefinition.name)}`,
            fields: {
                docs: { type: new GraphQLList(nonNullOutput) },
                totalDocs: { type: GraphQLInt },
                page: { type: GraphQLInt },
                limit: { type: GraphQLInt },
                hasPrevPage: { type: GraphQLBoolean },
                hasNextPage: { type: GraphQLBoolean },
                totalPages: { type: GraphQLInt },
            },
        };
        return new GraphQLObjectType(result);
    }
}
