import { promisify } from 'util';
import { TestServer } from './test-server';
import { Color, Image, Product, Tag, Variant, Comment, Store } from '../src/models';
import { BeforeRemoveHook, BeforeRemoveHookInput } from '../lib/hook';
import { Injectable } from '@nestjs/common';
import { FAIL_CLEAN_UP_AFTER_REMOVE_HANDLER, FailCleanUpAfterRemoveHandler } from '../lib/default.hook';

const NEVER_REMOVE_ME = 'NEVER_REMOVE_ME';

@Injectable()
class VariantHook {
  @BeforeRemoveHook(() => Variant)
  async beforeRemove({ beforeRemoved }: BeforeRemoveHookInput<Variant>): Promise<void> {
    if (beforeRemoved.name === NEVER_REMOVE_ME) {
      throw new Error('Cannot remove Awesome variant');
    }
  }
}

const handleAll = jest.fn();
const handleItem = jest.fn();

@Injectable()
class FailHandler implements FailCleanUpAfterRemoveHandler {
  handleAll = handleAll;
  handleItem = handleItem;
}

const server = TestServer.init({
  definitions: [Store, Product, Tag, Variant, Image, Color, Comment],
  dryerProviders: [VariantHook],
  appProviders: [
    {
      provide: FAIL_CLEAN_UP_AFTER_REMOVE_HANDLER,
      useClass: FailHandler,
    },
  ],
  resolverConfigs: [
    { definition: Store, allowedApis: '*' },
    { definition: Product, allowedApis: '*' },
    { definition: Tag, allowedApis: '*' },
    { definition: Variant, allowedApis: '*' },
    { definition: Image, allowedApis: '*' },
    { definition: Color, allowedApis: '*' },
    { definition: Comment, allowedApis: '*' },
  ],
});

describe('Remove options work', () => {
  beforeAll(async () => {
    await server.start();
  });

  let product: Product;

  beforeEach(async () => {
    const { createProduct } = await server.makeSuccessRequest({
      query: `
        mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) {
            id
            variants {
              id
              comments {
                id
              }
            }
            tags {
              id
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
          tags: [{ name: 'Tag_A' }, { name: 'Tag_B' }],
        },
      },
    });

    product = createProduct;
  });

  afterEach(() => server.cleanDatabase());

  it('Cannot remove product that hasMany Variants', async () => {
    await server.makeFailRequest({
      query: `
        mutation RemoveProduct($removeProductId: ObjectId!) {
          removeProduct(id: $removeProductId) {
            success
          }
        }
        `,
      variables: {
        removeProductId: product.id,
      },
      errorMessageMustContains: 'has link(s) to Variant',
    });
  });

  it('Cannot remove variants with CleanUpRelationsAfterRemoved mode', async () => {
    await server.makeFailRequest({
      query: `
        mutation RemoveVariant($removeVariantId: ObjectId!) {
          removeVariant(id: $removeVariantId, options: { mode: IgnoreRelations }) {
            success
          }
        }
      `,
      variables: {
        removeVariantId: product.variants[0].id,
      },
      errorMessageMustContains: 'Remove mode IgnoreRelations is not allowed for Variant',
    });
  });

  it('Can remove product that hasMany variants with IgnoreRelations mode', async () => {
    await server.makeSuccessRequest({
      query: `
        mutation RemoveProduct($removeProductId: ObjectId!) {
          removeProduct(id: $removeProductId, options: { mode: IgnoreRelations }) {
            success
          }
        }
      `,
      variables: {
        removeProductId: product.id,
      },
    });
  });

  it('Can remove product that hasMany variants with CleanUpRelationsAfterRemoved mode', async () => {
    await server.makeSuccessRequest({
      query: `
        mutation RemoveProduct($removeProductId: ObjectId!) {
          removeProduct(id: $removeProductId, options: { mode: CleanUpRelationsAfterRemoved }) {
            success
          }
        }
      `,
      variables: {
        removeProductId: product.id,
      },
    });
    await promisify(setTimeout)(100);

    const response = await server.makeSuccessRequest({
      query: `
          {
            allVariants {
              id
            }
            allComments {
              id
            }
          }
        `,
    });
    expect(response).toEqual({ allVariants: [], allComments: [] });
  });

  it('Can remove product that hasMany variants with CleanUpRelationsAfterRemoved mode', async () => {
    await server.makeSuccessRequest({
      query: `
        mutation bulkUpdateVariants($inputs: [UpdateVariantInput!]!){
          bulkUpdateVariants(inputs: $inputs){
            success
          }
        }
      `,
      variables: {
        inputs: [
          {
            id: product.variants[0].id,
            name: NEVER_REMOVE_ME,
          },
          {
            id: product.variants[1].id,
            name: NEVER_REMOVE_ME,
          },
        ],
      },
    });
    await promisify(setTimeout)(100);

    handleItem
      .mockImplementationOnce(() => 'Do Nothing')
      .mockImplementationOnce(() => {
        throw new Error('Stop');
      });

    await server.makeSuccessRequest({
      query: `
        mutation RemoveProduct($removeProductId: ObjectId!) {
          removeProduct(id: $removeProductId, options: { mode: CleanUpRelationsAfterRemoved }) {
            success
          }
        }
      `,
      variables: {
        removeProductId: product.id,
      },
    });
    await promisify(setTimeout)(100);
    expect(handleItem).toBeCalledTimes(2);
    expect(handleAll).toBeCalledTimes(1);
  });

  it('Remove tag must remove tag from product with CleanUpRelationsAfterRemoved mode', async () => {
    await server.makeSuccessRequest({
      query: `
        mutation RemoveTag($removeTagId: ObjectId!) {
          removeTag(id: $removeTagId, options: { mode: CleanUpRelationsAfterRemoved }) {
            success
          }
        }
      `,
      variables: {
        removeTagId: product.tags[0].id,
      },
    });
    await promisify(setTimeout)(100);
    const response = await server.makeSuccessRequest({
      query: `
          {
            product(id: "${product.id}") {
              tagIds
            }
          }
        `,
    });
    expect(response.product).toEqual({ tagIds: [product.tags[1].id] });
  });

  afterAll(async () => {
    await server.stop();
  });
});
