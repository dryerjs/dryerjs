import {
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLBoolean,
    GraphQLList,
} from 'graphql';
import * as util from '../util';
import { ModelDefinition } from '../shared';
import { MetaKey } from '../metadata';
import { Property } from '../property';
import { inspect } from '../inspect';

export class FilterableInputTypeBuilder {
    constructor(private modelDefinition: ModelDefinition) {}

    getType() {
        const result = {
            name: `${this.modelDefinition.name}Filter`,
            fields: {},
        };

        for (const property of inspect(this.modelDefinition).getProperties(MetaKey.Filterable)) {
            result.fields[property.name] = { type: this.getFilterType(property) };
        }

        return new GraphQLInputObjectType(result);
    }

    private getFilterType(property: Property) {
        const result = {
            name: `${this.modelDefinition.name}${util.toPascalCase(property.name)}Filter`,
            fields: {},
        };

        for (const operator of property.getFilterableOptions().operators) {
            if (operator === 'eq') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'notEq') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'in') {
                result.fields[operator] = { type: new GraphQLList(GraphQLString) };
                continue;
            }
            if (operator === 'notIn') {
                result.fields[operator] = { type: new GraphQLList(GraphQLString) };
                continue;
            }
            if (operator === 'exists') {
                result.fields[operator] = { type: GraphQLBoolean };
                continue;
            }
            if (operator === 'gt') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'gte') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'lt') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'lte') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'regex') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'notRegex') {
                result.fields[operator] = { type: GraphQLString };
                continue;
            }
            if (operator === 'all') {
                result.fields[operator] = { type: new GraphQLList(GraphQLString) };
                continue;
            }
        }

        return new GraphQLInputObjectType(result);
    }
}
