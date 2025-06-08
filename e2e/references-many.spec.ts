import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';
import { DefaultHook } from '../lib/default.hook';
import { ObjectId } from '../lib/object-id';

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
});

describe('References many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  let product: Product;
  const preExistingTags: Tag[] = [];
  const preExistingColors: Color[] = [];

  beforeAll(async () => {
    const colorNames = ['red', 'blue', 'orange'];
    for (const name of colorNames) {
      const { createColor } = await server.makeSuccessRequest({
        query: `
          mutation CreateColor($input: CreateColorInput!) {
            createColor(input: $input) {
              id 
              name
            }
          }
        `,
        variables: {
          input: {
            name,
          },
        },
      });

      preExistingColors.push(createColor);
    }

    const tagNames = ['70s', '80s'];
    for (const name of tagNames) {
      const { createTag } = await server.makeSuccessRequest({
        query: `
          mutation CreateTag($input: CreateTagInput!) {
            createTag(input: $input) {
              id
              name
              colorIds
              colors {
                id 
                name
              }
            }
          }
        `,
        variables: {
          input: {
            name,
          },
        },
      });
      preExistingTags.push(createTag);
    }
  });

  it('Create product with tags and colors', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
            tagIds
            tags {
              id 
              name
              colorIds
              colors {
                id 
                name
              }
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product',
          tagIds: preExistingTags.map((tag) => tag.id),
          tags: [
            {
              name: '100s',
              colorIds: preExistingColors.map((color) => color.id),
              colors: [{ name: 'black' }, { name: 'yellow' }],
            },
          ],
        },
      },
    });

    expect(response.createProduct).toEqual({
      id: expect.any(String),
      name: 'Awesome product',
      tagIds: expect.arrayContaining(preExistingTags.map((tag) => tag.id)),
      tags: [
        ...preExistingTags,
        {
          id: expect.any(String),
          name: '100s',
          colorIds: expect.arrayContaining(preExistingColors.map((color) => color.id)),
          colors: [
            ...preExistingColors,
            {
              id: expect.any(String),
              name: 'black',
            },
            {
              id: expect.any(String),
              name: 'yellow',
            },
          ],
        },
      ],
    });
    product = response.createProduct;
  });

  let productWithoutTags: Product;

  it('Create product without tags', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            name
            tagIds
            tags {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Awesome product 2',
        },
      },
    });

    expect(response.createProduct).toEqual({
      id: expect.any(String),
      name: 'Awesome product 2',
      tagIds: [],
      tags: [],
    });

    productWithoutTags = response.createProduct;
  });

  it('Add tags to product', async () => {
    const defaultHook = server.app.get(DefaultHook, { strict: false });
    const spy = jest.spyOn(defaultHook, 'mustExist' as any);
    const setTags = async (tagIds: any[]) => {
      const query = `
      mutation UpdateProduct($input: UpdateProductInput!) {
        updateProduct(input: $input) {
          id
        }
      }
    `;
      await server.makeSuccessRequest({
        query,
        variables: {
          input: {
            id: productWithoutTags.id,
            tagIds,
          },
        },
      });
    };
    await setTags([preExistingTags[0].id]);
    expect(spy).toHaveBeenCalledWith(Tag, new ObjectId(preExistingTags[0].id));
    spy.mockReset();
    await setTags([preExistingTags[0].id, preExistingTags[1].id]);
    expect(spy).toHaveBeenCalledWith(Tag, new ObjectId(preExistingTags[1].id));
    // reset the test
    spy.mockRestore();
    await setTags([]);
  });

  it('Cannot remove tag if it is linked to a product', async () => {
    await server.makeFailRequest({
      query: `
        mutation RemoveTag($id: ObjectId!) {
          removeTag(id: $id) {
            success
          }
        }
      `,
      variables: {
        id: preExistingTags[0].id,
      },
      errorMessageMustContains: 'has link(s) to Product',
    });
  });

  it('Cannot remove tag if no product links to it', async () => {
    await server.makeSuccessRequest({
      query: `
        mutation UpdateProduct($input: UpdateProductInput!) {
          updateProduct(input: $input) {
            tagIds
          }
        }
      `,
      variables: {
        input: {
          id: product.id,
          tagIds: [],
        },
      },
    });
    await server.makeSuccessRequest({
      query: `
        mutation RemoveTag($id: ObjectId!) {
          removeTag(id: $id) {
            success
          }
        }
      `,
      variables: {
        id: preExistingTags[0].id,
      },
    });
  });

  it('Cannot create tag from store', async () => {
    await server.makeFailRequest({
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
          tags: [{ name: 'Awesome tag' }],
        },
      },
      errorMessageMustContains: 'Field "tags" is not defined',
    });
  });

  it('Cannot get all tags from store', async () => {
    await server.makeFailRequest({
      query: `
        query Query($storeId: ObjectId!) {
          store(id: $storeId) {
            tags {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: {
          storeId: '000000000000000000000000',
        },
      },
      errorMessageMustContains: 'Cannot query field "tags" on type "Store".',
    });
  });

  it('Cannot create product with non exist tagIds', async () => {
    await server.makeFailRequest({
      query: `
            mutation CreateProduct($input: CreateProductInput!) {
              createProduct(input: $input) {
                tagIds
                name
                id
              }
            }
      `,
      variables: {
        input: {
          name: 'product A',
          tagIds: ['000000000000000000000001'],
        },
      },
      errorMessageMustContains: 'No Tag found with ID: 000000000000000000000001',
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
