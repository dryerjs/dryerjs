import { TestServer } from './test-server';
import { Author } from '../src/models';

const server = TestServer.init({
  definitions: [Author],
});

describe('Embedded works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create author with books', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            name
            books {
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome author',
          books: [{ name: 'Awesome book 1' }, { name: 'Awesome book 2' }],
        },
      },
    });
    expect(response.createAuthor).toEqual({
      name: 'Awesome author',
      books: [{ name: 'Awesome book 1' }, { name: 'Awesome book 2' }],
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
