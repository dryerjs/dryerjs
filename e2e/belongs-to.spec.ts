import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
});

describe('BelongsTo works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create product with invalid store id will throw error', async () => {
    await server.makeFailRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product',
          storeId: '000000000000000000000000',
        },
      },
      errorMessageMustContains: 'No Store found with ID: 000000000000000000000000',
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
