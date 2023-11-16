import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
});

describe('Has many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  let product: Product;

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

    product = createProduct;
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

  it('Cannot create product from store', async () => {
    await server.makeFailRequest({
      query: `
        mutation CreateStore($input: CreateStoreInput!) {
          createStore(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome store',
          products: [{ name: 'Awesome product' }],
        },
      },
      errorMessageMustContains: 'Field "products" is not defined',
    });
  });

  it('Cannot update variant productId to a not exist ID', async () => {
    await server.makeFailRequest({
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
          id: product.variants[0].id,
          productId: '000000000000000000000000',
        },
      },
      errorMessageMustContains: `No Product found with ID: 000000000000000000000000`,
    });
  });

  it('Cannot get all products in store', async () => {
    await server.makeFailRequest({
      query: `
        query Query($storeId: ObjectId!) {
          store(id: $storeId) {
            id
            name
            products {
              id
              name
            }
          }
        }
      `,
      variables: {
        storeId: '000000000000000000000000',
      },
      errorMessageMustContains: 'Cannot query field "products" on type "Store".',
    });
  });

  it('Cannot paginate product in store', async () => {
    await server.makeFailRequest({
      query: `
        query Query($storeId: ObjectId!) {
          store(id: $storeId) {
            id
            name
            paginateProducts {
              page
              totalDocs
              totalPages
            }
          }
        }
      `,
      variables: {
        storeId: '000000000000000000000000',
      },
      errorMessageMustContains: 'Cannot query field "paginateProducts" on type "Store".',
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
