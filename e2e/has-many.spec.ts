import { TestServer } from './test-server';
import { Image, Product, Tag, Variant } from '../src/models';

const server = TestServer.init({
  definitions: [Product, Tag, Variant, Image],
});

describe('Has many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create product with image', async () => {
    const { createProduct } = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
            variants {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product',
          variants: [
            {
              name: 'Awesome variant',
            },
            {
              name: 'Awesome variant 2',
            },
          ],
        },
      },
    });

    expect(createProduct.variants).toHaveLength(2);
    expect(createProduct.variants).toEqual([
      {
        id: expect.any(String),
        name: 'Awesome variant',
      },
      {
        id: expect.any(String),
        name: 'Awesome variant 2',
      },
    ]);
  });

  afterAll(async () => {
    await server.stop();
  });
});
