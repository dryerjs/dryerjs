import { TestServer } from './test-server';

import { Transform } from 'class-transformer';
import { MaxLength } from 'class-validator';

import { Definition, Embedded, Thunk, ObjectId, Property, Id } from '../lib';

@Definition()
export class Novel {
  @Id()
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Property()
  name: string;
}

@Definition({ allowedApis: '*' })
export class Novelist {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Embedded(() => Novel, { allowApis: ['create'] })
  novels: Novel[];
}

const server = TestServer.init({
  definitions: [Novelist],
});

describe('Embedded works', () => {
  beforeAll(async () => {
    await server.start();
  });

  let novelist: Novelist;

  it('Create novelist with novels', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateNovelist($input: CreateNovelistInput!) {
          createNovelist(input: $input) {
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
          name: 'Awesome novelist',
          novels: [{ name: 'Awesome novel 1' }, { name: 'Awesome novel 2' }],
        },
      },
    });
    expect(response.createNovelist).toEqual({
      id: expect.any(String),
      name: 'Awesome novelist',
      novels: [
        { id: expect.any(String), name: 'Awesome novel 1' },
        { id: expect.any(String), name: 'Awesome novel 2' },
      ],
    });

    novelist = response.createNovelist;
  });

  it('Get one novel within novelist', async () => {
    const response = await server.makeFailRequest({
      query: `
        query NovelistNovel($novelistId: ID!, $novelId: ID!) {
          novelistNovel(novelistId: $novelistId, id: $novelId) {
            id
            name
          }
        }
      `,
      variables: {
        novelistId: novelist.id,
        novelId: novelist.novels[0].id,
      },
    });

    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('Get all novels within novelist', async () => {
    const response = await server.makeFailRequest({
      query: `
        query NovelistNovels($novelistId: ID!) {
          novelistNovels(novelistId: $novelistId) {
            id
            name
          }
        }
      `,
      variables: {
        novelistId: novelist.id,
      },
    });

    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('Create novel within novelist', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateNovelistNovels($inputs: [CreateNovelInput!]!, $novelistId: ObjectId!) {
          createNovelistNovels(inputs: $inputs, novelistId: $novelistId) {
            id
            name
          }
        }
      `,
      variables: {
        inputs: [{ name: 'Awesome novel 3' }, { name: 'Awesome novel 4' }],
        novelistId: novelist.id,
      },
    });
    expect(response.createNovelistNovels).toEqual([
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

  it('Create novelist without novels', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateNovelist($input: CreateNovelistInput!) {
          createNovelist(input: $input) {
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
          name: 'Awesome novelist 2',
        },
      },
    });
    expect(response.createNovelist).toEqual({
      id: expect.any(String),
      name: 'Awesome novelist 2',
      novels: [],
    });
  });

  it('Update novels within novelist: return error if BAD_REQUEST', async () => {
    const novels = novelist.novels.map((novel: any) => {
      return { ...novel, name: `${novel.name}-edit` };
    });
    const response = await server.makeFailRequest({
      query: `
        mutation updateNovelistNovels($novelistId: ID!, $inputs: [UpdateNovelInput!]!) {
          updateNovelistNovels(novelistId: $novelistId, inputs: $inputs) {
            id
            name
          }
        }
      `,
      variables: {
        novelistId: novelist.id,
        inputs: novels,
      },
    });
    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it("Remove novelist's novels", async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation RemoveNovelistNovels($novelistId: ID!, $novelIds: [ID!]!) {
          removeNovelistNovels(novelistId: $novelistId, ids: $novelIds) {
            success
          }
        }
      `,
      variables: {
        novelistId: novelist.id,
        novelIds: [novelist.novels[0].id],
      },
    });
    expect(response[0].extensions.code).toEqual('GRAPHQL_VALIDATION_FAILED');
  });

  it('test trim transform for novel name', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateNovelist($input: CreateNovelistInput!) {
          createNovelist(input: $input) {
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
          name: 'Awesome novelist 4',
          novels: [{ name: '   Awesome novel 4    ' }, { name: '    Awesome novel 5   ' }],
        },
      },
    });

    expect(response.createNovelist).toEqual({
      id: expect.any(String),
      name: 'Awesome novelist 4',
      novels: [
        { id: expect.any(String), name: 'Awesome novel 4' },
        { id: expect.any(String), name: 'Awesome novel 5' },
      ],
    });
  });

  it('test max length validation for novel name', async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation CreateNovelist($input: CreateNovelistInput!) {
          createNovelist(input: $input) {
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
          name: 'Awesome novelist 5',
          novels: [{ name: 'a'.repeat(101) }],
        },
      },
    });
    expect(response[0].extensions.originalError.message[0]).toContain('name must be shorter');
  });

  afterAll(async () => {
    await server.stop();
  });
});
