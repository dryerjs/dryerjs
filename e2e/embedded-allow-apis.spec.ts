import { TestServer } from './test-server';

import * as graphql from 'graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { MaxLength, ValidateNested } from 'class-validator';
import { Field } from '@nestjs/graphql';

import { Property, Definition, Embedded, Thunk, OutputType, CreateInputType, UpdateInputType } from '../lib';

@Definition()
export class Novel {
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

  @Prop({ type: [SchemaFactory.createForClass(Novel)] })
  @Thunk(Field(() => [OutputType(Novel)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Novel)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [UpdateInputType(Novel)], { nullable: true }), { scopes: 'update' })
  @Thunk(Type(() => CreateInputType(Novel)), { scopes: 'create' })
  @Thunk(Type(() => UpdateInputType(Novel)), { scopes: 'update' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'create' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'update' })
  @Embedded(() => Novel, { allowApis: ['create'] })
  novels: Novel[];
}

const server = TestServer.init({
  definitions: [Author],
});

describe('Embedded works', () => {
  beforeAll(async () => {
    await server.start();
  });

  let author: Author;

  it('Create author with novels', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            novels {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome author',
          novels: [{ name: 'Awesome novel 1' }, { name: 'Awesome novel 2' }],
        },
      },
    });
    expect(response.createAuthor).toEqual({
      id: expect.any(String),
      name: 'Awesome author',
      novels: [
        { id: expect.any(String), name: 'Awesome novel 1' },
        { id: expect.any(String), name: 'Awesome novel 2' },
      ],
    });

    author = response.createAuthor;
  });

  it('Get one novel within author', async () => {
    const response = await server.makeFailRequest({
      query: `
        query AuthorNovel($authorId: ID!, $novelId: ID!) {
          authorNovel(authorId: $authorId, id: $novelId) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
        novelId: author.novels[0].id,
      },
    });

    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('Get all novels within author', async () => {
    const response = await server.makeFailRequest({
      query: `
        query AuthorNovels($authorId: ID!) {
          authorNovels(authorId: $authorId) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
      },
    });

    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('Create novel within author', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthorNovel($inputs: [CreateNovelInput!]!, $authorId: ID!) {
          createAuthorNovel(inputs: $inputs, authorId: $authorId) {
            id
            name
          }
        }
      `,
      variables: {
        inputs: [{ name: 'Awesome novel 3' }, { name: 'Awesome novel 4' }],
        authorId: author.id,
      },
    });
    expect(response.createAuthorNovel).toEqual([
      {
        id: expect.any(String),
        name: 'Awesome novel 3',
      },
      {
        id: expect.any(String),
        name: 'Awesome novel 4',
      },
    ]);
  });

  it('Create author without novels', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            novels {
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
      novels: [],
    });
  });

  it('Update novels within author: return error if BAD_REQUEST', async () => {
    const novels = author.novels.map((novel: any) => {
      return { ...novel, name: `${novel.name}-edit` };
    });
    const response = await server.makeFailRequest({
      query: `
        mutation updateAuthorNovels($authorId: ID!, $inputs: [UpdateNovelInput!]!) {
          updateAuthorNovels(authorId: $authorId, inputs: $inputs) {
            id
            name
          }
        }
      `,
      variables: {
        authorId: author.id,
        inputs: novels,
      },
    });
    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it("Remove author's novels", async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation RemoveAuthorNovels($authorId: ID!, $novelIds: [ID!]!) {
          removeAuthorNovels(authorId: $authorId, ids: $novelIds) {
            success
          }
        }
      `,
      variables: {
        authorId: author.id,
        novelIds: [author.novels[0].id],
      },
    });
    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('test trim transform for novel name', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            novels {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome author 4',
          novels: [{ name: '   Awesome novel 4    ' }, { name: '    Awesome novel 5   ' }],
        },
      },
    });

    expect(response.createAuthor).toEqual({
      id: expect.any(String),
      name: 'Awesome author 4',
      novels: [
        { id: expect.any(String), name: 'Awesome novel 4' },
        { id: expect.any(String), name: 'Awesome novel 5' },
      ],
    });
  });

  it('test max length validation for novel name', async () => {
    await expect(
      server.makeSuccessRequest({
        query: `
        mutation CreateAuthor($input: CreateAuthorInput!) {
          createAuthor(input: $input) {
            id
            name
            novels {
              id
              name
            }
          }
        }
      `,
        variables: {
          input: {
            name: 'Awesome author 5',
            novels: [{ name: 'a'.repeat(101) }],
          },
        },
      }),
    ).rejects.toThrow('name must be shorter than or equal to 100 characters');
  });

  afterAll(async () => {
    await server.stop();
  });
});
