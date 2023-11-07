import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant } from '../src/models';

const server = TestServer.init({
  definitions: [Product, Tag, Variant, Image, Color],
});

describe('References many works', () => {
  beforeAll(async () => {
    await server.start();
  });

  const preExistingTags: Tag[] = [];
  const preExistingColors: Color[] = [];

  beforeAll(async () => {
    const colorNames = ['red', 'blue', 'orange'];
    for(const name of colorNames) {
      const {createColor} = await server.makeSuccessRequest({
        query: `
          mutation CreateColor($input: CreateColorInput!) {
            createColor(input: $input) {
              id 
              name
            }
          }
        `,variables: {
          input: {
            name
          }
        }
      })

      preExistingColors.push(createColor)
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
          tags: [{ 
            name: '100s',
            colorIds: preExistingColors.map((color) => color.id),
            colors: [{ name: 'black'}, {name: 'yellow'}]
          }],
        },
      },
    });

    console.log(response.createProduct)
    console.log(response.createProduct.tags[2].colors)

    expect(response.createProduct).toEqual({
      id: expect.any(String),
      name: 'Awesome product',
      tagIds: expect.arrayContaining(preExistingTags.map((tag) => tag.id)),
      tags:   [
        ...preExistingTags,
        {
          id: expect.any(String),
          name: '100s',
          colorIds: expect.arrayContaining(preExistingColors.map((color) => color.id)),
          colors: [
            ...preExistingColors,
            {
              id: expect.any(String),
              name:'black'
            }, 
            {
              id: expect.any(String),
              name:'yellow'
            }]
        },
      ],
    });
  });

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
  });

  afterAll(async () => {
    await server.stop();
  });
});
