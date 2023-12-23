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

@Definition({ timestamps: true })
export class Tag extends BaseModel {
  @Property()
  name: string;
}

@Definition({ timestamps: true })
export class Product extends BaseModel {
  @Property()
  name: string;
}

const server = TestServer.init({
  definitions: [Tag, Product],
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

    const { createProduct } = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
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

    expect(createProduct).toEqual({
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
