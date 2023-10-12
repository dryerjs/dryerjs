import { GraphQLInputObjectType, GraphQLList, GraphQLBoolean } from 'graphql';
import * as util from '../util';
import { FilterOperator, ModelDefinition } from '../shared';
import { MetaKey } from '../metadata';
import { Property } from '../property';
import { inspect } from '../inspect';

export class FilterInputTypeBuilder {
    constructor(private modelDefinition: ModelDefinition) {}

    public getType() {
        const result = {
            name: `${this.modelDefinition.name}Filter`,
            fields: {},
        };

        for (const property of inspect(this.modelDefinition).getProperties(MetaKey.Filterable)) {
            result.fields[property.name] = { type: this.getFilterType(property) };
        }

        if (Object.keys(result.fields).length === 0) return null;

        return new GraphQLInputObjectType(result);
    }

    private getTypeByOperator(property: Property, operator: FilterOperator) {
        const listOperators = ['in', 'notIn', 'all'];
        if (listOperators.includes(operator)) {
            return new GraphQLList(property.getScalarOrEnumType());
        }
        if (operator === 'exists') return GraphQLBoolean;
        return property.getScalarOrEnumType();
    }

    private getFilterType(property: Property) {
        const result = {
            name: `${this.modelDefinition.name}${util.toPascalCase(property.name)}Filter`,
            fields: {},
        };

        for (const operator of property.getFilterableOptions().operators) {
            result.fields[operator] = {
                type: this.getTypeByOperator(property, operator),
            };
        }

        return new GraphQLInputObjectType(result);
    }
}
