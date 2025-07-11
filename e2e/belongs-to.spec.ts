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

  it('loader works', async () => {
    const store = await server.makeSuccessRequest({
      query: `
        mutation CreateStore($input: CreateStoreInput!) {
          createStore(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome store',
        },
      },
    });

    const product = await server.makeSuccessRequest({
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
          storeId: store.createStore.id,
        },
      },
    });

    const image = await server.makeSuccessRequest({
      query: `
        mutation CreateImage($input: CreateImageInput!) {
          createImage(input: $input) {
            id
            productId
            product { id }
          }
        }
      `,
      variables: {
        input: {
          productId: product.createProduct.id,
          name: 'Awesome image',
        },
      },
    });

    expect(image.createImage.product.id).toBe(product.createProduct.id);
  });

  afterAll(async () => {
    await server.stop();
  });
});
