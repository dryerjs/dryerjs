import { Customer, Product, Tag, Variant, Image, Color, Comment } from '../src/models';
import { TestServer } from './test-server';

const server = TestServer.init({
  definitions: [Customer, Product, Tag, Variant, Image, Color, Comment],
});

describe('Paginate works', () => {
  const preExsitingProducts: Product[] = [];
  beforeAll(async () => {
    await server.start();

    const products = [
      { name: 'A', variants: [{ name: 'a' }, { name: 'a1' }, { name: 'a2' }] },
      { name: 'B', variants: [{ name: 'b' }] },
      { name: 'C', variants: [{ name: 'c' }] },
      { name: 'D', variants: [{ name: 'd' }] },
    ];

    for (const product of products) {
      const { createProduct } = await server.makeSuccessRequest({
        query: `
          mutation CreateProduct($input: CreateProductInput!) {
            createProduct(input: $input) {
              id
              name
              variants {
                id
                name 
                productId
              }
            }
          }
        `,
        variables: { input: product },
      });
      preExsitingProducts.push(createProduct);
    }

    const customers = [
      { name: 'John', email: 'john@example.com', numberOfOrders: 10 },
      { name: 'Jane', email: 'jane@example.com', numberOfOrders: 15 },
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
      variables: { filter: { name: { in: ['John', 'Jane'] } } },
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
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { notIn: ['John', 'Jane'] } } },
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

  it('eq filter with objectId', async () => {
    const { paginateVariants } = await server.makeSuccessRequest({
      query: `
      query PaginateVariants($filter: VariantFilter) {
        paginateVariants(filter: $filter) {
          docs {
            productId
            name
            id
          }
          totalDocs
        }
      }
      `,
      variables: { filter: { productId: { eq: preExsitingProducts[0].id } } },
    });

    const expectedVariants = preExsitingProducts[0].variants;
    expect(paginateVariants.docs).toEqual([...expectedVariants]);
    expect(paginateVariants.totalDocs).toEqual(3);
  });

  it('in filter with objectId', async () => {
    const { paginateVariants } = await server.makeSuccessRequest({
      query: `
      query PaginateVariants($filter: VariantFilter) {
        paginateVariants(filter: $filter) {
          docs {
            productId
            name
            id
          }
          totalDocs
        }
      }
      `,
      variables: { filter: { productId: { in: [preExsitingProducts[0].id, preExsitingProducts[1].id] } } },
    });

    const expectedVariants = [...preExsitingProducts[0].variants, ...preExsitingProducts[1].variants];
    expect(paginateVariants.docs).toEqual(expectedVariants);
    expect(paginateVariants.totalDocs).toEqual(4);
  });

  afterAll(async () => {
    await server.stop();
  });
});
