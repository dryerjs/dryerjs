import { TestServer } from './test-server';
import { Author } from '../src/models';
import { UseGuards } from '@nestjs/common';
import { UserGuard } from '../src/models/fake-guards';
import { BaseService, getBaseServiceToken } from '../lib/base.service';
import { ObjectId } from '../lib/object-id';

const server = TestServer.init({
  definitions: [
    {
      definition: Author,
      embeddedConfigs: [
        {
          property: 'books',
          allowedApis: ['create', 'update', 'remove', 'findOne', 'findAll'],
          decorators: { remove: UseGuards(UserGuard) },
        },
      ],
    },
  ],
});

const NOT_FOUND_ID = '000000000000000000000000';

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
              title
              reviews { 
                id
                content
              }
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome author',
          books: [
            { title: 'Awesome book 1', reviews: [{ content: 'worth reading' }] },
            { title: 'Awesome book 2' },
          ],
        },
      },
    });
    expect(response.createAuthor).toEqual({
      id: expect.any(String),
      name: 'Awesome author',
      books: [
        {
          id: expect.any(String),
          title: 'Awesome book 1',
          reviews: [{ id: expect.any(String), content: 'worth reading' }],
        },
        { id: expect.any(String), title: 'Awesome book 2', reviews: [] },
      ],
    });

    author = response.createAuthor;
  });

  it('id should be object ids', async () => {
    const authorService = server.app.get<BaseService>(getBaseServiceToken(Author), { strict: false });
    const fetchedAuthor = await authorService.findOne('fakeContext', { _id: author.id });
    expect(fetchedAuthor.books[0].id instanceof ObjectId).toBeTruthy();
    expect(fetchedAuthor.books[0].reviews[0].id instanceof ObjectId).toBeTruthy();
  });

  it('Get one book within author', async () => {
    const { authorBook } = await server.makeSuccessRequest({
      query: `
        query AuthorBook($authorId: ObjectId!, $bookId: ObjectId!) {
          authorBook(authorId: $authorId, id: $bookId) {
            id
            title
            reviews {
              id
              content 
            }
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
      title: 'Awesome book 1',
      reviews: [
        {
          id: expect.any(String),
          content: 'worth reading',
        },
      ],
    });
  });

  it('Get one book within author: return error if item not found', async () => {
    await server.makeFailRequest({
      query: `
        query AuthorBook($authorId: ObjectId!, $bookId: ObjectId!) {
          authorBook(authorId: $authorId, id: $bookId) {
            id
            title
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookId: NOT_FOUND_ID,
      },
      errorMessageMustContains: 'No Book found with ID 000000000000000000000000',
    });
  });

  it('Get all books within author', async () => {
    const { authorBooks } = await server.makeSuccessRequest({
      query: `
        query AuthorBooks($authorId: ObjectId!) {
          authorBooks(authorId: $authorId) {
            id
            title
            reviews {
              id
              content
            }
          }
        }
      `,
      variables: {
        authorId: author.id,
      },
    });

    expect(authorBooks).toEqual([
      {
        id: expect.any(String),
        title: 'Awesome book 1',
        reviews: [{ id: expect.any(String), content: 'worth reading' }],
      },
      { id: expect.any(String), title: 'Awesome book 2', reviews: [] },
    ]);
  });

  it('Create book and reviews within author', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthorBooks($inputs: [CreateBookInput!]!, $authorId: ObjectId!) {
          createAuthorBooks(inputs: $inputs, authorId: $authorId) {
            id
            title
            reviews {
              id
              content 
            }
          }
        }
      `,
      variables: {
        inputs: [
          {
            title: 'Awesome book 3',
            reviews: [
              {
                content: 'Book 3 - 1st review',
              },
              {
                content: 'Book 3 - 2nd review',
              },
            ],
          },
        ],
        authorId: author.id,
      },
    });

    expect(response.createAuthorBooks).toEqual([
      {
        id: expect.any(String),
        title: 'Awesome book 3',
        reviews: [
          {
            id: expect.any(String),
            content: 'Book 3 - 1st review',
          },
          {
            id: expect.any(String),
            content: 'Book 3 - 2nd review',
          },
        ],
      },
    ]);

    const { author: updatedAuthor } = await server.makeSuccessRequest({
      query: `
        query GetAuthor($id: ObjectId!) {
          author(id: $id) {
            id
            name
            books {
              id
              title
              reviews {
                id
                content
              }
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
      {
        id: response.createAuthorBooks[0].id,
        title: 'Awesome book 3',
        reviews: [
          { id: response.createAuthorBooks[0].reviews[0].id, content: 'Book 3 - 1st review' },
          { id: response.createAuthorBooks[0].reviews[1].id, content: 'Book 3 - 2nd review' },
        ],
      },
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
              reviews {
                id 
              }
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

  it('Update books and reviews within author', async () => {
    const firstBook = author.books[0];
    await server.makeSuccessRequest({
      query: `
        mutation updateAuthorBooks($authorId: ObjectId!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            title
            reviews {
              id
              content
            }
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: [
          {
            id: firstBook.id,
            title: `${firstBook.title}-edit`,
            reviews: [
              {
                id: firstBook.reviews[0].id,
                content: 'edited content',
              },
              {
                content: 'new content',
              },
            ],
          },
        ],
      },
    });

    // make request to authorBook to check if the update is successful
    const { authorBook } = await server.makeSuccessRequest({
      query: `
        query AuthorBook($authorId: ObjectId!, $bookId: ObjectId!) {
          authorBook(authorId: $authorId, id: $bookId) {
            id
            title
            reviews {
              id
              content 
            }
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookId: firstBook.id,
      },
    });

    expect(authorBook).toEqual({
      id: firstBook.id,
      title: `${firstBook.title}-edit`,
      reviews: [
        {
          id: firstBook.reviews[0].id,
          content: 'edited content',
        },
        {
          id: expect.any(String),
          content: 'new content',
        },
      ],
    });
  });

  it('Update books and reviews have whitespace name within author', async () => {
    const books = author.books.map((book: any) => {
      return {
        ...book,
        title: `  ${book.title}  `,
        reviews: book.reviews.map((review) => ({ ...review, content: `  ${review.content}   ` })),
      };
    });

    const trimmedBooks = books.map((book: any) => {
      return {
        ...book,
        title: book.title.trim(),
        reviews: book.reviews.map((review) => ({ ...review, content: review.content.trim() })),
      };
    });

    const { updateAuthorBooks } = await server.makeSuccessRequest({
      query: `
        mutation updateAuthorBooks($authorId: ObjectId!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            title
            reviews {
              id
              content 
            }
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: books,
      },
    });

    expect(updateAuthorBooks).toEqual(trimmedBooks);
  });

  it('Update books within author: return error if book name exceed 100', async () => {
    const books = author.books.map((book: any) => {
      return { ...book, title: `${book.title}${'a'.repeat(101)}` };
    });
    const response = await server.makeFailRequest({
      query: `
        mutation updateAuthorBooks($authorId: ObjectId!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            title
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: books,
      },
    });

    const errorMessage = response[0].extensions.originalError.message[0];
    expect(errorMessage).toEqual('title must be shorter than or equal to 100 characters');
  });

  it('Update books within author: return error if parent not found', async () => {
    await server.makeFailRequest({
      query: `
        mutation updateAuthorBooks($authorId: ObjectId!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            title
          }
        }
      `,
      variables: {
        authorId: NOT_FOUND_ID,
        inputs: author.books,
      },
      errorMessageMustContains: `No Author found with ID: ${NOT_FOUND_ID}`,
    });
  });

  it('Update books within author: return error if book not found', async () => {
    const books = author.books.map((book) => ({ ...book }));
    books[0].id = NOT_FOUND_ID as any;
    await server.makeFailRequest({
      query: `
        mutation updateAuthorBooks($authorId: ObjectId!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            title
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: books,
      },
      errorMessageMustContains: `No Book found with ID ${NOT_FOUND_ID}`,
    });
  });

  it('create and update author books should only return relevant items', async () => {
    const { createAuthorBooks } = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthorBooks($inputs: [CreateBookInput!]!, $authorId: ObjectId!) {
          createAuthorBooks(inputs: $inputs, authorId: $authorId) {
            id
            title
            reviews {
              id
              content
            }
          }
        }
      `,
      variables: {
        inputs: [
          {
            title: 'one more book',
            reviews: [
              {
                content: 'good looking book',
              },
            ],
          },
        ],
        authorId: author.id,
      },
    });

    expect(createAuthorBooks).toEqual([
      {
        id: expect.any(String),
        title: 'one more book',
        reviews: [
          {
            id: expect.any(String),
            content: 'good looking book',
          },
        ],
      },
    ]);

    const { updateAuthorBooks } = await server.makeSuccessRequest({
      query: `
        mutation updateAuthorBooks($authorId: ObjectId!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            title
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: [{ id: createAuthorBooks[0].id, title: 'updated book' }],
      },
    });
    expect(updateAuthorBooks).toEqual([{ id: createAuthorBooks[0].id, title: 'updated book' }]);
  });

  it("Remove author's books", async () => {
    await server.makeSuccessRequest({
      query: `
        mutation RemoveAuthorBooks($authorId: ObjectId!, $bookIds: [ObjectId!]!) {
          removeAuthorBooks(authorId: $authorId, ids: $bookIds) {
            success
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookIds: [author.books[0].id],
      },
      headers: { 'fake-role': 'user' },
    });

    const updated = await server.makeSuccessRequest({
      query: `
      query AuthorBooks($authorId: ObjectId!) {
        authorBooks(authorId: $authorId) {
          id
        }
      }
      `,
      variables: {
        authorId: author.id,
      },
    });
    expect(updated.authorBooks.map(({ id }) => id).includes(author.books[0].id)).toBeFalsy();
  });

  it("Remove author's books: return error if parent not found", async () => {
    await server.makeFailRequest({
      query: `
        mutation RemoveAuthorBooks($authorId: ObjectId!, $bookIds: [ObjectId!]!) {
          removeAuthorBooks(authorId: $authorId, ids: $bookIds) {
            success
          }
        }
      `,
      variables: {
        authorId: '5e6b4b5b1c9d440000d2c7f3',
        bookIds: ['5e6b4b5b1c9d440000d2c7f3'],
      },
      headers: { 'fake-role': 'user' },
      errorMessageMustContains: 'No Author found with ID: 5e6b4b5b1c9d440000d2c7f3',
    });
  });

  it("Remove author's books: return error if no IDs provided", async () => {
    await server.makeFailRequest({
      query: `
        mutation RemoveAuthorBooks($authorId: ObjectId!, $bookIds: [ObjectId!]!) {
          removeAuthorBooks(authorId: $authorId, ids: $bookIds) {
            success
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookIds: [],
      },
      headers: { 'fake-role': 'user' },
      errorMessageMustContains: 'No Book IDs provided',
    });
  });

  it('Remove without permission', async () => {
    await server.makeFailRequest({
      query: `
        mutation RemoveAuthorBooks($authorId: ObjectId!, $bookIds: [ObjectId!]!) {
          removeAuthorBooks(authorId: $authorId, ids: $bookIds) {
            success
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookIds: [],
      },
      errorMessageMustContains: 'Forbidden',
    });
  });

  it('test trim transform for book title', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            books {
              id
              title
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome author 4',
          books: [{ title: '   Awesome book 4    ' }, { title: '    Awesome book 5   ' }],
        },
      },
    });

    expect(response.createAuthor).toEqual({
      id: expect.any(String),
      name: 'Awesome author 4',
      books: [
        { id: expect.any(String), title: 'Awesome book 4' },
        { id: expect.any(String), title: 'Awesome book 5' },
      ],
    });
  });

  it('test max length validation for book title', async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            books {
              id
              title
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome author 5',
          books: [{ title: 'a'.repeat(101) }],
        },
      },
    });
    expect(response[0].extensions.originalError.message[0]).toContain('title must be shorter');
  });

  afterAll(async () => {
    await server.stop();
  });
});
