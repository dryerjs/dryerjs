import * as graphql from 'graphql';
import {
    ExcludeOnCreate,
    Filterable,
    GraphQLType,
    NullableOnOutput,
    Property,
    RequiredOnCreate,
    Schema,
} from '../metadata';
import { DryerTest } from './dryer-test';
import { allFilterOperators } from '../shared';

@Schema({})
class User {
    @ExcludeOnCreate()
    @Property()
    @Filterable({ operators: allFilterOperators })
    id: string;

    @Property()
    @Filterable({ operators: allFilterOperators })
    @RequiredOnCreate()
    name: string;

    @Property()
    @RequiredOnCreate()
    @Filterable({ operators: allFilterOperators })
    email: string;

    @Property()
    @GraphQLType(graphql.GraphQLInt)
    @NullableOnOutput()
    @Filterable({ operators: allFilterOperators })
    numberOfOrders: number;
}

export const dryer = DryerTest.init({
    modelDefinitions: [User],
});

describe('Paginate with filter works', () => {
    beforeAll(async () => {
        await dryer.start();

        // create 5 users from input array
        const users = [
            { name: 'John', email: 'john@example.com', numberOfOrders: 10 },
            { name: 'Jane', email: 'jane@example.com', numberOfOrders: 15 },
            { name: 'Jack', email: 'jack@example.com', numberOfOrders: 20 },
            { name: 'Jill', email: 'jill@example.com' },
            { name: 'Joe', email: 'joe@example.com', numberOfOrders: null },
        ];

        for (const user of users) {
            await dryer.makeSuccessRequest({
                query: `
                    mutation CreateUser($input: CreateUserInput!) {
                        createUser(input: $input) {
                            id
                        }
                    }
                `,
                variables: { input: user },
            });
        }
    });

    const query = `
        query PaginateUsers($options: PaginatedUsersOptions) {
            paginateUsers(options: $options) {
                docs {
                    email
                    numberOfOrders
                }
                totalDocs
            }
        }
    `;

    it('should return all users', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { page: 1, limit: 10, filter: {} } },
        });

        expect(paginateUsers.docs).toHaveLength(5);
        expect(paginateUsers.totalDocs).toEqual(5);
    });

    it('eq', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { eq: 10 } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [{ email: 'john@example.com', numberOfOrders: 10 }],
            totalDocs: 1,
        });
    });

    it('notEq', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { notEq: 20 } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jill@example.com', numberOfOrders: null },
                { email: 'joe@example.com', numberOfOrders: null },
            ],
            totalDocs: 4,
        });
    });

    it('in', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { in: ['John', 'Jane'] } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
            ],
            totalDocs: 2,
        });
    });

    it('notIn', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { notIn: ['John', 'Jane'] } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'jack@example.com', numberOfOrders: 20 },
                { email: 'jill@example.com', numberOfOrders: null },
                { email: 'joe@example.com', numberOfOrders: null },
            ],
            totalDocs: 3,
        });
    });

    it('contains', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { contains: 'Ja' } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jack@example.com', numberOfOrders: 20 },
            ],
            totalDocs: 2,
        });
    });

    it('notContains', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { notContains: 'Ja' } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jill@example.com', numberOfOrders: null },
                { email: 'joe@example.com', numberOfOrders: null },
            ],
            totalDocs: 3,
        });
    });

    it('gt with lt', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { lt: 20, gt: 10 } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [{ email: 'jane@example.com', numberOfOrders: 15 }],
            totalDocs: 1,
        });
    });

    it('gte with lte', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { lte: 20, gte: 10 } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jack@example.com', numberOfOrders: 20 },
            ],
            totalDocs: 3,
        });
    });

    it('regex with notRegex', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { email: { regex: 'jo', notRegex: 'john' } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [{ email: 'joe@example.com', numberOfOrders: null }],
            totalDocs: 1,
        });
    });

    it('exists = true', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { exists: true } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jack@example.com', numberOfOrders: 20 },
            ],
            totalDocs: 3,
        });
    });

    it('exists = false', async () => {
        const { paginateUsers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { exists: false } } } },
        });

        expect(paginateUsers).toEqual({
            docs: [
                { email: 'jill@example.com', numberOfOrders: null },
                { email: 'joe@example.com', numberOfOrders: null },
            ],
            totalDocs: 2,
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
