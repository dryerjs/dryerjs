import { TestServer } from './test-server';
import { Author } from '../src/models';

const server = TestServer.init({
  definitions: [Author],
});

describe('Embedded works', () => {
  beforeAll(async () => {
    await server.start();
  });

  let author: Author;

  it('Create author with books', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            books {
              id
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
      id: expect.any(String),
      name: 'Awesome author',
      books: [
        { id: expect.any(String), name: 'Awesome book 1' },
        { id: expect.any(String), name: 'Awesome book 2' },
      ],
    });

    author = response.createAuthor;

    const { authorBook } = await server.makeSuccessRequest({
      query: `
        query AuthorBook($authorId: ID!, $bookId: ID!) {
          authorBook(authorId: $authorId, id: $bookId) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookId: author.books[0].id,
      },
    });

    expect(authorBook).toEqual({
      id: author.books[0].id,
      name: 'Awesome book 1',
    });
  });

  it('Create book within author', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthorBook($input: CreateBookInput!, $authorId: ID!) {
          createAuthorBook(input: $input, authorId: $authorId) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome book 3',
        },
        authorId: author.id,
      },
    });
    expect(response.createAuthorBook).toEqual({
      id: expect.any(String),
      name: 'Awesome book 3',
    });

    const { author: updatedAuthor } = await server.makeSuccessRequest({
      query: `
        query GetAuthor($id: ID!) {
          author(id: $id) {
            id
            name
            books {
              id
              name
            }
          }
        }
      `,
      variables: {
        id: author.id,
      },
    });

    expect(updatedAuthor.books).toEqual([
      ...author.books,
      { id: expect.any(String), name: 'Awesome book 3' },
    ]);
  });

  it('Create author without books', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            books {
              id
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome author 2',
        },
      },
    });
    expect(response.createAuthor).toEqual({
      id: expect.any(String),
      name: 'Awesome author 2',
      books: [],
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
