import * as graphql from 'graphql';
import * as util from '../util';
import { Model } from '../model';

export function found<T>(value: T | null, model: Model, id: string): T {
    if (util.isNil(value)) {
        throw new graphql.GraphQLError(`No ${util.toCamelCase(model.name)} found with id ${id}`, {
            extensions: {
                code: 'NOT_FOUND',
                http: { status: 404 },
            },
        });
    }
    return value;
}
