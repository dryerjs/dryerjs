import { GraphQLISODateTime } from '@nestjs/graphql';
import { Definition, Id, ObjectId, Property, Skip } from 'dryerjs';
import { TestServer } from './test-server';

export class BaseModel {
  @Id()
  id: ObjectId;

  @Property({
    output: { type: () => GraphQLISODateTime },
    create: Skip,
    update: Skip,
  })
  createdAt: Date;

  @Property({
    output: { type: () => GraphQLISODateTime },
    create: Skip,
    update: Skip,
  })
  updatedAt: Date;
}

@Definition({
  allowedApis: '*',
  timestamps: true,
  removalConfig: {
    allowCleanUpRelationsAfterRemoved: true,
  },
})
export class Tag extends BaseModel {
  @Property()
  name: string;
}

const server = TestServer.init({
  definitions: [Tag],
});

describe('BaseModel works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create', async () => {
    const { createTag } = await server.makeSuccessRequest({
      query: `
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
            name
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        input: {
          name: 'test',
        },
      },
    });

    expect(createTag).toEqual({
      id: expect.any(String),
      name: 'test',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
