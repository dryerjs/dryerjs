import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
});

describe('Has many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create product without image', async () => {
    const { createProduct } = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
            variants {
              id
              name 
              comments {
                id
                content
              }
              product {
                name
              }
            }
            paginateVariants {
              docs {
                name
              }
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
              comments: [{ content: 'A' }, { content: 'B' }],
            },
            {
              name: 'Awesome variant 2',
            },
          ],
        },
      },
    });

    expect(createProduct.paginateVariants.docs).toHaveLength(2);
    expect(createProduct.variants).toHaveLength(2);
    expect(createProduct.variants).toEqual([
      {
        id: expect.any(String),
        name: 'Awesome variant',
        comments: [
          {
            id: expect.any(String),
            content: 'A',
          },
          {
            id: expect.any(String),
            content: 'B',
          },
        ],
        product: { name: 'Awesome product' },
      },
      {
        id: expect.any(String),
        name: 'Awesome variant 2',
        comments: [],
        product: { name: 'Awesome product' },
      },
    ]);
  });

  afterAll(async () => {
    await server.stop();
  });
});
