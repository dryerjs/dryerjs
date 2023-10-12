import { convertGraphQLFilterToMongoQuery } from './filter-converter';

describe('convertGraphQLFilterToMongoQuery', () => {
    it('should convert GraphQL filter to Mongo query', () => {
        const graphqlFilter = {
            name: {
                eq: 'John',
            },
            age: {
                gt: 18,
            },
        };

        const mongoQuery = convertGraphQLFilterToMongoQuery(graphqlFilter);

        expect(mongoQuery).toEqual({
            name: { $eq: 'John' },
            age: { $gt: 18 },
        });
    });

    it('contains and notContains', () => {
        const graphqlFilter = {
            firstName: {
                contains: 'John',
            },
            lastName: {
                notContains: 'Doe',
            },
        };

        const mongoQuery = convertGraphQLFilterToMongoQuery(graphqlFilter);

        expect(mongoQuery).toEqual({
            firstName: { $regex: 'John', $options: 'i' },
            lastName: { $not: { $regex: 'Doe', $options: 'i' } },
        });
    });

    it('exists', () => {
        expect(
            convertGraphQLFilterToMongoQuery({
                firstName: {
                    exists: true,
                },
            }),
        ).toEqual({
            firstName: { $ne: null },
        });

        expect(
            convertGraphQLFilterToMongoQuery({
                firstName: {
                    exists: false,
                },
            }),
        ).toEqual({
            firstName: {
                $exists: false,
            },
        });
    });
});
