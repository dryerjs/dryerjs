import { GraphQLInputObjectType, GraphQLEnumType } from 'graphql';
import { ModelDefinition } from '../shared';
import { MetaKey } from '../metadata';
import { inspect } from '../inspect';

const SortDirection = new GraphQLEnumType({
    name: 'SortDirection',
    values: {
        ASC: { value: 'ASC' },
        DESC: { value: 'DESC' },
    },
});

export class SortInputTypeBuilder {
    constructor(private modelDefinition: ModelDefinition) {}

    public getType() {
        const result = {
            name: `${this.modelDefinition.name}Sort`,
            fields: {},
        };

        for (const property of inspect(this.modelDefinition).getProperties(MetaKey.Sortable)) {
            result.fields[property.name] = { type: SortDirection };
        }

        if (Object.keys(result.fields).length === 0) return null;

        return new GraphQLInputObjectType(result);
    }
}
