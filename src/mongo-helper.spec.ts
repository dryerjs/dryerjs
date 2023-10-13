import { MongoHelper } from './mongo-helper';

describe('MongoHelper', () => {
    describe('toQuery', () => {
        it('should convert GraphQL filter to Mongo query', () => {
            const graphqlFilter = {
                name: {
                    eq: 'John',
                },
                age: {
                    gt: 18,
                },
            };

            const mongoQuery = MongoHelper.toQuery(graphqlFilter);

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

            const mongoQuery = MongoHelper.toQuery(graphqlFilter);

            expect(mongoQuery).toEqual({
                firstName: { $regex: 'John', $options: 'i' },
                lastName: { $not: { $regex: 'Doe', $options: 'i' } },
            });
        });

        it('exists', () => {
            expect(
                MongoHelper.toQuery({
                    firstName: {
                        exists: true,
                    },
                }),
            ).toEqual({
                firstName: { $ne: null },
            });

            expect(
                MongoHelper.toQuery({
                    firstName: {
                        exists: false,
                    },
                }),
            ).toEqual({
                firstName: {
                    $not: {
                        $ne: null,
                    },
                },
            });
        });
    });

    it('toSort', () => {
        const graphqlSort = {
            name: 'ASC' as const,
            age: 'DESC' as const,
        };

        const mongoSort = MongoHelper.toSort(graphqlSort);

        expect(mongoSort).toEqual({
            name: 1,
            age: -1,
        });
    });
});
