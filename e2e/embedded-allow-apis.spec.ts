import { TestServer } from './test-server';

import * as graphql from 'graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { MaxLength, ValidateNested } from 'class-validator';
import { Field } from '@nestjs/graphql';

import { Property, Definition, Embedded, Thunk, OutputType, CreateInputType, UpdateInputType } from '../lib';

@Definition()
export class Book {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  name: string;
}

@Definition({ allowedApis: '*' })
export class Author {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: [SchemaFactory.createForClass(Book)] })
  @Thunk(Field(() => [OutputType(Book)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Book)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [UpdateInputType(Book)], { nullable: true }), { scopes: 'update' })
  @Thunk(Type(() => CreateInputType(Book)), { scopes: 'create' })
  @Thunk(Type(() => UpdateInputType(Book)), { scopes: 'update' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'create' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'update' })
  @Embedded(() => Book, { allowApis: ['getOne'] })
  books: Book[];
}

const server = TestServer.init({
  definitions: [Author],
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
  });

  it('Get one book within author', async () => {
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

  it('Get all books within author', async () => {
    const { authorBooks } = await server.makeSuccessRequest({
      query: `
        query AuthorBooks($authorId: ID!) {
          authorBooks(authorId: $authorId) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
      },
    });

    expect(authorBooks).toEqual([
      { id: expect.any(String), name: 'Awesome book 1' },
      { id: expect.any(String), name: 'Awesome book 2' },
    ]);
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

  it('Update books within author', async () => {
    const books = author.books.map((book: any) => {
      return { ...book, name: `${book.name}-edit` };
    });
    const { updateAuthorBooks } = await server.makeSuccessRequest({
      query: `
        mutation updateAuthorBooks($authorId: ID!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: books,
      },
    });
    expect(updateAuthorBooks).toEqual(books);
  });

  it('Update books have whitespace name within author', async () => {
    const books = author.books.map((book: any) => {
      return { ...book, name: `  ${book.name}  ` };
    });

    const trimmedBooks = books.map((book: any) => {
      return { ...book, name: book.name.trim() };
    });

    const { updateAuthorBooks } = await server.makeSuccessRequest({
      query: `
        mutation updateAuthorBooks($authorId: ID!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            name
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
      return { ...book, name: `${book.name}${'a'.repeat(101)}` };
    });
    const response = await server.makeFailRequest({
      query: `
        mutation updateAuthorBooks($authorId: ID!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: books,
      },
    });

    const errorMessage = response[0].extensions.originalError.message[0];
    expect(errorMessage).toEqual('name must be shorter than or equal to 100 characters');
  });

  it('Update books within author: return error if parent not found', async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation updateAuthorBooks($authorId: ID!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: NOT_FOUND_ID,
        inputs: author.books,
      },
    });
    expect(response[0].message).toEqual(`No author found with ID ${NOT_FOUND_ID}`);
  });

  it('Update books within author: return error if book not found', async () => {
    const books = [...author.books];
    books[0].id = NOT_FOUND_ID;
    const response = await server.makeFailRequest({
      query: `
        mutation updateAuthorBooks($authorId: ID!, $inputs: [UpdateBookInput!]!) {
          updateAuthorBooks(authorId: $authorId, inputs: $inputs) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: books,
      },
    });
    expect(response[0].message).toEqual(`No book found with ID ${NOT_FOUND_ID}`);
  });

  it("Remove author's books", async () => {
    const { allAuthors } = await server.makeSuccessRequest({
      query: `
        query Authors {
          allAuthors {
            id
            books {
              id
            }
          }
        }
      `,
    });

    const author = allAuthors[0];

    const response = await server.makeSuccessRequest({
      query: `
        mutation RemoveAuthorBooks($authorId: ID!, $bookIds: [ID!]!) {
          removeAuthorBooks(authorId: $authorId, ids: $bookIds) {
            success
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookIds: [author.books[0].id],
      },
    });
    expect(response.removeAuthorBooks).toEqual({ success: true });
  });

  it("Remove author's books: return error if parent not found", async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation RemoveAuthorBooks($authorId: ID!, $bookIds: [ID!]!) {
          removeAuthorBooks(authorId: $authorId, ids: $bookIds) {
            success
          }
        }
      `,
      variables: {
        authorId: '5e6b4b5b1c9d440000d2c7f3',
        bookIds: ['5e6b4b5b1c9d440000d2c7f3'],
      },
    });
    expect(response[0].message).toEqual('No author found with ID 5e6b4b5b1c9d440000d2c7f3');
  });

  it("Remove author's books: return error if no IDs provided", async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation RemoveAuthorBooks($authorId: ID!, $bookIds: [ID!]!) {
          removeAuthorBooks(authorId: $authorId, ids: $bookIds) {
            success
          }
        }
      `,
      variables: {
        authorId: author.id,
        bookIds: [],
      },
    });
    expect(response[0].message).toEqual('No book IDs provided');
  });

  it('test trim transform for book name', async () => {
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
          name: 'Awesome author 4',
          books: [{ name: '   Awesome book 4    ' }, { name: '    Awesome book 5   ' }],
        },
      },
    });

    expect(response.createAuthor).toEqual({
      id: expect.any(String),
      name: 'Awesome author 4',
      books: [
        { id: expect.any(String), name: 'Awesome book 4' },
        { id: expect.any(String), name: 'Awesome book 5' },
      ],
    });
  });

  it('test max length validation for book name', async () => {
    await expect(
      server.makeSuccessRequest({
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
            name: 'Awesome author 5',
            books: [{ name: 'a'.repeat(101) }],
          },
        },
      }),
    ).rejects.toThrow('name must be shorter than or equal to 100 characters');
  });

  afterAll(async () => {
    await server.stop();
  });
});
