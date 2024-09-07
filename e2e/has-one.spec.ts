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
              storageId
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
            storageId: '000000000000000000000000',
            name: 'logo.png',
          },
        },
      },
    });
    productId = createProduct.id;
    expect(createProduct.image.name).toEqual('logo.png');
    expect(createProduct.image.product.image.name).toEqual('logo.png');
    expect(createProduct.image.storageId).toEqual('000000000000000000000000');
  });

  it('Remove product has image', async () => {
    await server.makeFailRequest({
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
      errorMessageMustContains: 'has link(s) to Image',
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
