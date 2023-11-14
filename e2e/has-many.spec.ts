import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';
import { ObjectId } from '../lib/object-id';

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
});

describe('Has many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  let productId;
  let variantId;

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

    productId = createProduct.id;
    variantId = createProduct.variants[0].id;
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

  it('Delete product hasMany Variants', async () => {
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
      `Unable to delete Product with the Id ${productId} as it still maintains a relations with associated variants`,
    );
    expect(extensionsCode).toEqual('INTERNAL_SERVER_ERROR');
  });

  it('Update variant with productId of non exist Product', async () => {
    const response = await server.makeFailRequest({
      query: `
        mutation Mutation($input: UpdateVariantInput!) {
          updateVariant(input: $input) {
            id
            productId
          }
        }
      `,
      variables: {
        input: {
          id: variantId,
          productId:'000000000000000000000001',
        },
      },
    });
    const errorMessage = response[0].message;
    const extensionsCode = response[0].extensions.code;
    expect(errorMessage).toEqual(`No Product found with ID: 000000000000000000000001`);
    expect(extensionsCode).toEqual('INTERNAL_SERVER_ERROR');
  });

  afterAll(async () => {
    await server.stop();
  });
});
