import * as util from './util';
import { FilterOperator } from './shared';

const contains = (value: string) => ({ $regex: value, $options: 'i' });
const notContains = (value: string) => ({ $not: { $regex: value, $options: 'i' } });

type ConvertOperatorFunction = (value: any) => object;

const configs: {
    from: FilterOperator;
    to: string | ConvertOperatorFunction;
}[] = [
    { from: 'eq', to: '$eq' },
    { from: 'notEq', to: '$ne' },
    { from: 'in', to: '$in' },
    { from: 'all', to: '$all' },
    { from: 'contains', to: contains },
    { from: 'notContains', to: notContains },
    { from: 'notIn', to: '$nin' },
    { from: 'regex', to: contains },
    { from: 'notRegex', to: notContains },
    { from: 'lt', to: '$lt' },
    { from: 'lte', to: '$lte' },
    { from: 'gt', to: '$gt' },
    { from: 'gte', to: '$gte' },
    {
        from: 'exists',
        to: (value: boolean) => {
            if (value) return { $ne: null };
            return { $exists: false };
        },
    },
];

type GraphQLField = { [key: string]: { [operator: string]: any } };

export const convertGraphQLFilterToMongoQuery = (graphqlFilter: GraphQLField) => {
    const result: any = {};

    for (const [fieldName, field] of Object.entries(graphqlFilter)) {
        for (const [operator, value] of Object.entries(field)) {
            const config = configs.find(c => c.from === operator);
            /* istanbul ignore next */
            if (util.isNil(config)) throw new Error(`Unknown filter operator: ${operator}`);
            result[fieldName] = util.isFunction(config.to)
                ? (config.to as ConvertOperatorFunction)(value)
                : { [config.to as string]: value };
        }
    }

    return result;
};
