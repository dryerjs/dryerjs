import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
});

describe('Has one works', () => {
  beforeAll(async () => {
    await server.start();
  });

  let productId;

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
              product {
                id
                name
                image {
                  id
                  name
                }
              }
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
    productId = createProduct.id;
    expect(createProduct.image.name).toEqual('logo.png');
    expect(createProduct.image.product.image.name).toEqual('logo.png');
  });

  it('Delete product has image', async () => {
    const response = await server.makeFailRequest({
      query: `
      mutation RemoveProduct($removeProductId: ObjectId!) {
        removeProduct(id: $removeProductId) {
          success
        }
      }
      `,
      variables: {
        removeProductId: productId,
      },
    });
    const errorMessage = response[0].message;
    const extensionsCode = response[0].extensions.code;
    expect(errorMessage).toEqual(
      `Unable to delete Product with the Id ${productId} as it still maintains a relationship with an associated image`,
    );
    expect(extensionsCode).toEqual('INTERNAL_SERVER_ERROR');
  });

  afterAll(async () => {
    await server.stop();
  });
});
