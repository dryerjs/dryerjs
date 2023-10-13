import * as graphql from 'graphql';
import {
    ExcludeOnCreate,
    Filterable,
    GraphQLType,
    NullableOnOutput,
    Property,
    RequiredOnCreate,
    Schema,
    Sortable,
} from '../metadata';
import { DryerTest } from './dryer-test';
import { allFilterOperators } from '../shared';

@Schema({})
class Customer {
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
    @Sortable()
    numberOfOrders: number;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Customer],
});

describe('Paginate with filter works', () => {
    beforeAll(async () => {
        await dryer.start();

        // create 5 customers from input array
        const customers = [
            { name: 'John', email: 'john@example.com', numberOfOrders: 10 },
            { name: 'Jane', email: 'jane@example.com', numberOfOrders: 15 },
            { name: 'Jack', email: 'jack@example.com', numberOfOrders: 20 },
            { name: 'Jill', email: 'jill@example.com' },
            { name: 'Joe', email: 'joe@example.com', numberOfOrders: null },
        ];

        for (const customer of customers) {
            await dryer.makeSuccessRequest({
                query: `
                    mutation CreateCustomer($input: CreateCustomerInput!) {
                        createCustomer(input: $input) {
                            id
                        }
                    }
                `,
                variables: { input: customer },
            });
        }
    });

    const query = `
        query PaginateCustomers($options: PaginatedCustomersOptions) {
            paginateCustomers(options: $options) {
                docs {
                    email
                    numberOfOrders
                }
                totalDocs
            }
        }
    `;

    it('should return all customers', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { page: 1, limit: 10, filter: {} } },
        });

        expect(paginateCustomers.docs).toHaveLength(5);
        expect(paginateCustomers.totalDocs).toEqual(5);
    });

    it('eq', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { eq: 10 } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [{ email: 'john@example.com', numberOfOrders: 10 }],
            totalDocs: 1,
        });
    });

    it('notEq', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { notEq: 20 } } } },
        });

        expect(paginateCustomers).toEqual({
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
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { in: ['John', 'Jane'] } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
            ],
            totalDocs: 2,
        });
    });

    it('notIn', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { notIn: ['John', 'Jane'] } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'jack@example.com', numberOfOrders: 20 },
                { email: 'jill@example.com', numberOfOrders: null },
                { email: 'joe@example.com', numberOfOrders: null },
            ],
            totalDocs: 3,
        });
    });

    it('contains', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { contains: 'Ja' } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jack@example.com', numberOfOrders: 20 },
            ],
            totalDocs: 2,
        });
    });

    it('notContains', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { name: { notContains: 'Ja' } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jill@example.com', numberOfOrders: null },
                { email: 'joe@example.com', numberOfOrders: null },
            ],
            totalDocs: 3,
        });
    });

    it('gt with lt', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { lt: 20, gt: 10 } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [{ email: 'jane@example.com', numberOfOrders: 15 }],
            totalDocs: 1,
        });
    });

    it('gte with lte', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { lte: 20, gte: 10 } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jack@example.com', numberOfOrders: 20 },
            ],
            totalDocs: 3,
        });
    });

    it('regex with notRegex', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { email: { regex: 'jo', notRegex: 'john' } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [{ email: 'joe@example.com', numberOfOrders: null }],
            totalDocs: 1,
        });
    });

    it('exists = true', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { exists: true } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jack@example.com', numberOfOrders: 20 },
            ],
            totalDocs: 3,
        });
    });

    it('exists = false', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: { options: { filter: { numberOfOrders: { exists: false } } } },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'jill@example.com', numberOfOrders: null },
                { email: 'joe@example.com', numberOfOrders: null },
            ],
            totalDocs: 2,
        });
    });

    it('sort asc', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: {
                options: { sort: { numberOfOrders: 'ASC' }, filter: { numberOfOrders: { exists: true } } },
            },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'john@example.com', numberOfOrders: 10 },
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'jack@example.com', numberOfOrders: 20 },
            ],
            totalDocs: 3,
        });
    });

    it('sort desc', async () => {
        const { paginateCustomers } = await dryer.makeSuccessRequest({
            query,
            variables: {
                options: { sort: { numberOfOrders: 'DESC' }, filter: { numberOfOrders: { exists: true } } },
            },
        });

        expect(paginateCustomers).toEqual({
            docs: [
                { email: 'jack@example.com', numberOfOrders: 20 },
                { email: 'jane@example.com', numberOfOrders: 15 },
                { email: 'john@example.com', numberOfOrders: 10 },
            ],
            totalDocs: 3,
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
