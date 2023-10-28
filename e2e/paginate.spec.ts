import { TestServer } from './test-server';
import { Author } from '../src/models';

const server = TestServer.init({
  definitions: [Author],
});

describe('Paginate works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Paginate author without page and limit', async () => {
    const { paginateAuthors } = await server.makeSuccessRequest({
      query: `
        query PaginateAuthors {
          paginateAuthors {
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
    expect(paginateAuthors.docs.length).toBeLessThanOrEqual(10);
    expect(paginateAuthors.page).toEqual(1);
    expect(paginateAuthors.limit).toBeLessThanOrEqual(10);
  });

  it('Paginate author with page but without limit', async () => {
    const { paginateAuthors } = await server.makeSuccessRequest({
      query: `
        query PaginateAuthors($page: Int!) {
          paginateAuthors(page: $page) {
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
    expect(paginateAuthors.docs.length).toBeLessThanOrEqual(10);
    expect(paginateAuthors.page).toEqual(1);
    expect(paginateAuthors.limit).toEqual(10);
  });

  it('Paginate author with page and limit', async () => {
    const { paginateAuthors } = await server.makeSuccessRequest({
      query: `
        query PaginateAuthors($page: Int!, $limit: Int!) {
          paginateAuthors(page: $page, limit: $limit) {
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
    expect(paginateAuthors.docs.length).toBeLessThanOrEqual(2);
    expect(paginateAuthors.page).toEqual(1);
    expect(paginateAuthors.limit).toEqual(2);
  });

  afterAll(async () => {
    await server.stop();
  });
});
