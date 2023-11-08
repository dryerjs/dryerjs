import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment } from '../src/models';

const server = TestServer.init({
  definitions: [Product, Tag, Variant, Image, Color, Comment],
});

describe('Has one works', () => {
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
            image {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product',
          image: {
            name: 'logo.png',
          },
        },
      },
    });

    expect(createProduct.image.name).toEqual('logo.png');
  });

  afterAll(async () => {
    await server.stop();
  });
});
