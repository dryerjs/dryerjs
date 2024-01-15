import { Customer } from '../src/models';
import { TestServer } from './test-server';

const server = TestServer.init({
  definitions: [Customer],
  resolverConfigs: [{ definition: Customer, allowedApis: '*' }],
});

describe('Paginate works', () => {
  beforeAll(async () => {
    await server.start();

    const customers = [
      { name: 'John', email: 'john@example.com', numberOfOrders: 10, countryId: '000000000000000000000001' },
      {
        name: 'Jane Joe',
        email: 'jane@example.com',
        numberOfOrders: 15,
        countryId: '000000000000000000000002',
      },
      { name: 'Jack', email: 'jack@example.com', numberOfOrders: 20 },
      { name: 'Jill', email: 'jill@example.com', numberOfOrders: null },
      { name: 'Joe', email: 'joe@example.com', numberOfOrders: null },
    ];

    for (const customer of customers) {
      await server.makeSuccessRequest({
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

  it('sort the data returned in ascending order', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!, $sort: CustomerSort) {
          paginateCustomers(page: $page, limit: $limit, sort: $sort) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
      `,
      variables: { page: 1, limit: 10, sort: { email: 'ASC' } },
    });
    expect(paginateCustomers.docs).toHaveLength(5);
    expect(paginateCustomers.totalDocs).toEqual(5);
    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jack@example.com', numberOfOrders: expect.any(Number) },
        { email: 'jane@example.com', numberOfOrders: expect.any(Number) },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
        { email: 'john@example.com', numberOfOrders: expect.any(Number) },
      ],
      totalDocs: 5,
    });
  });

  it('sort the data returned in descending order', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!, $sort : CustomerSort) {
          paginateCustomers(page: $page, limit: $limit, sort: $sort) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
      `,
      variables: { page: 1, limit: 10, sort: { email: 'DESC' } },
    });
    expect(paginateCustomers.docs).toHaveLength(5);
    expect(paginateCustomers.totalDocs).toEqual(5);
    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: expect.any(Number) },
        { email: 'joe@example.com', numberOfOrders: null },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'jane@example.com', numberOfOrders: expect.any(Number) },
        { email: 'jack@example.com', numberOfOrders: expect.any(Number) },
      ],
      totalDocs: 5,
    });
  });

  it('sort the data returned by id in descending order', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!, $sort: CustomerSort) {
          paginateCustomers(page: $page, limit: $limit, sort: $sort) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
      `,
      variables: { page: 1, limit: 10, sort: { id: 'DESC' } },
    });
    expect(paginateCustomers.docs).toHaveLength(5);
    expect(paginateCustomers.totalDocs).toEqual(5);
    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'joe@example.com', numberOfOrders: null },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'jack@example.com', numberOfOrders: expect.any(Number) },
        { email: 'jane@example.com', numberOfOrders: expect.any(Number) },
        { email: 'john@example.com', numberOfOrders: expect.any(Number) },
      ],
      totalDocs: 5,
    });
  });

  it('sort the data returned in descending order and filter', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!, $sort : CustomerSort , $filter: CustomerFilter) {
          paginateCustomers(page: $page, limit: $limit, sort: $sort, filter: $filter) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
      `,
      variables: {
        page: 1,
        limit: 10,
        sort: { email: 'DESC' },
        filter: {
          email: {
            in: ['john@example.com', 'jane@example.com'],
          },
        },
      },
    });
    expect(paginateCustomers.docs).toHaveLength(2);
    expect(paginateCustomers.totalDocs).toEqual(2);
    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: expect.any(Number) },
        { email: 'jane@example.com', numberOfOrders: expect.any(Number) },
      ],
      totalDocs: 2,
    });
  });

  it('sort the data returned in ascending order and filter', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!, $sort : CustomerSort , $filter: CustomerFilter) {
          paginateCustomers(page: $page, limit: $limit, sort: $sort, filter: $filter) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
      `,
      variables: {
        page: 1,
        limit: 10,
        sort: { email: 'ASC' },
        filter: {
          email: {
            in: ['john@example.com', 'jane@example.com'],
          },
        },
      },
    });
    expect(paginateCustomers.docs).toHaveLength(2);
    expect(paginateCustomers.totalDocs).toEqual(2);
    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jane@example.com', numberOfOrders: expect.any(Number) },
        { email: 'john@example.com', numberOfOrders: expect.any(Number) },
      ],
      totalDocs: 2,
    });
  });

  it('sort the data returned in ascending order without page and limit', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($sort : CustomerSort) {
          paginateCustomers(sort: $sort) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
      `,
      variables: { sort: { email: 'ASC' } },
    });
    expect(paginateCustomers.docs).toHaveLength(5);
    expect(paginateCustomers.totalDocs).toEqual(5);
    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jack@example.com', numberOfOrders: expect.any(Number) },
        { email: 'jane@example.com', numberOfOrders: expect.any(Number) },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
        { email: 'john@example.com', numberOfOrders: expect.any(Number) },
      ],
      totalDocs: 5,
    });
  });

  it('should return all customers', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!, $filter : CustomerFilter) {
          paginateCustomers(page: $page, limit: $limit,filter: $filter) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
    `,
      variables: { page: 1, limit: 10, filter: {} },
    });
    expect(paginateCustomers.docs).toHaveLength(5);
    expect(paginateCustomers.totalDocs).toEqual(5);
  });

  const query = `
    query PaginateCustomers($filter: CustomerFilter){
      paginateCustomers(filter: $filter) {
        docs {
          email
          numberOfOrders
        }
        totalDocs
      }
    }
  `;

  it('eq', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { eq: 10 } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'john@example.com', numberOfOrders: 10 }],
      totalDocs: 1,
    });
  });

  it('Get all with filter by id', async () => {
    const customers = await server.makeSuccessRequest({
      query: `
        query getCustomers {
          allCustomers {
            id
            email
            name
          } 
        }
      `,
    });
    const expectedCustomer = customers.allCustomers[0];

    const { allCustomers } = await server.makeSuccessRequest({
      query: `
        query FindAllCustomers($filter: CustomerFilter) {
          allCustomers(filter: $filter) {
            id
            email 
            name
          } 
        }
      `,
      variables: { filter: { id: { eq: expectedCustomer.id } } },
    });

    expect(allCustomers).toEqual([expectedCustomer]);
  });

  it('notEq', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { notEq: 20 } } },
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
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { in: ['John', 'Jack'] } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: 10 },
        { email: 'jack@example.com', numberOfOrders: 20 },
      ],
      totalDocs: 2,
    });
  });

  it('notIn', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { notIn: ['John', 'Jack'] } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jane@example.com', numberOfOrders: 15 },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
      ],
      totalDocs: 3,
    });
  });

  it('contains', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { contains: 'Ja' } } },
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
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { notContains: 'Ja' } } },
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
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { lt: 20, gt: 10 } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'jane@example.com', numberOfOrders: 15 }],
      totalDocs: 1,
    });
  });

  it('gte with lte', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { lte: 20, gte: 10 } } },
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
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { email: { regex: 'jo', notRegex: 'john' } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'joe@example.com', numberOfOrders: null }],
      totalDocs: 1,
    });
  });

  it('exists = true', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { exists: true } } },
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
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { exists: false } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
      ],
      totalDocs: 2,
    });
  });

  it('Paginate customer without page and limit', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers {
          paginateCustomers {
            docs {
              id
            }
            totalPages
            page
            limit
          }
        }
      `,
    });
    expect(paginateCustomers.docs.length).toBeLessThanOrEqual(10);
    expect(paginateCustomers.page).toEqual(1);
    expect(paginateCustomers.limit).toBeLessThanOrEqual(10);
  });

  it('Paginate customer with page but without limit', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!) {
          paginateCustomers(page: $page) {
            docs {
              id
            }
            totalPages
            page
            limit
          }
        }
      `,
      variables: {
        page: 1,
      },
    });
    expect(paginateCustomers.docs.length).toBeLessThanOrEqual(10);
    expect(paginateCustomers.page).toEqual(1);
    expect(paginateCustomers.limit).toEqual(10);
  });

  it('Paginate customer with page and limit', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!) {
          paginateCustomers(page: $page, limit: $limit) {
            docs {
              id
            }
            totalPages
            page
            limit
          }
        }
      `,
      variables: {
        page: 1,
        limit: 2,
      },
    });
    expect(paginateCustomers.docs.length).toBeLessThanOrEqual(2);
    expect(paginateCustomers.page).toEqual(1);
    expect(paginateCustomers.limit).toEqual(2);
  });

  it('Get all with filter and sort', async () => {
    const { allCustomers } = await server.makeSuccessRequest({
      query: `
        query FindAllCustomers($filter: CustomerFilter, $sort: CustomerSort) {
          allCustomers(filter: $filter, sort: $sort) {
            email
          }
        }
      `,
      variables: {
        filter: {
          email: {
            in: ['john@example.com', 'jack@example.com', 'jane@example.com'],
          },
        },
        sort: {
          email: 'ASC',
        },
      },
    });

    expect(allCustomers).toEqual([
      { email: 'jack@example.com' },
      { email: 'jane@example.com' },
      { email: 'john@example.com' },
    ]);
  });

  it('eq with ObjectId as Primary Key', async () => {
    const { allCustomers } = await server.makeSuccessRequest({
      query: `
        query getCustomers {
          allCustomers {
            id
            email
            numberOfOrders
          }
        }
      `,
    });
    const expectedCustomer = allCustomers[0];

    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { id: { eq: expectedCustomer.id } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        {
          email: expectedCustomer.email,
          numberOfOrders: expectedCustomer.numberOfOrders,
        },
      ],
      totalDocs: 1,
    });
  });

  it('eq with ObjectId as Foreign Key', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { countryId: { eq: '000000000000000000000001' } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'john@example.com', numberOfOrders: 10 }],
      totalDocs: 1,
    });
  });

  it('in with ObjectId', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { countryId: { in: ['000000000000000000000001', '000000000000000000000002'] } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: 10 },
        { email: 'jane@example.com', numberOfOrders: 15 },
      ],
      totalDocs: 2,
    });
  });

  it('text search works', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { search: 'Jane Joe' } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jane@example.com', numberOfOrders: expect.any(Number) },
        { email: 'joe@example.com', numberOfOrders: null },
      ],
      totalDocs: 2,
    });
  });

  it('text search works with other filters', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { search: 'Jane John', numberOfOrders: { gt: 11 } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'jane@example.com', numberOfOrders: expect.any(Number) }],
      totalDocs: 1,
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
