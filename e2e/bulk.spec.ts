import { TestServer } from './test-server';
import { Tag } from '../src/models/product';

const server = TestServer.init({
  definitions: [Tag],
});

describe('bulk apis work', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Bulk create tags', async () => {
    const { bulkCreateTags } = await server.makeSuccessRequest({
      query: `
        mutation BulkCreateTag($inputs: [CreateTagInput!]!) {
          bulkCreateTags(inputs: $inputs) {
            input
            success
            errorMessage
            result {
              id
              name
            }
          }
        }
      `,
      variables: {
        inputs: [{ name: 'A' }, { name: 'A' }, { name: 'B' }],
      },
    });

    expect(bulkCreateTags).toEqual([
      {
        input: { name: 'A' },
        success: true,
        errorMessage: null,
        result: { id: expect.any(String), name: 'A' },
      },
      {
        input: { name: 'A' },
        success: false,
        errorMessage: 'INTERNAL_SERVER_ERROR',
        result: null,
      },
      {
        input: { name: 'B' },
        success: true,
        errorMessage: null,
        result: { id: expect.any(String), name: 'B' },
      },
    ]);
  });

  let allTags: Tag[] = [];

  it('Get all tags', async () => {
    const response = await server.makeSuccessRequest({
      query: `
      {
        allTags {
          id
          name
        }
      }
      `,
    });
    allTags = response.allTags;
  });

  it('Bulk delete tags', async () => {
    const { bulkDeleteTags } = await server.makeSuccessRequest({
      query: `
        mutation BulkDeleteTag($ids: [ID!]!){
          bulkDeleteTags(ids: $ids){
            id
            result
            errorMessage
          }
        }
      `,
      variables: {
        ids: [allTags[0].id, allTags[1].id, allTags[1].id],
      },
    });

    expect(bulkDeleteTags).toEqual([
      {
        id: allTags[0].id,
        result: 'success',
        errorMessage: null,
      },
      {
        id: allTags[1].id,
        result: 'success',
        errorMessage: null,
      },
      {
        id: allTags[1].id,
        result: 'fail',
        errorMessage: 'No Tag found with ID: ' + allTags[1].id,
      },
    ]);
  });

  afterAll(async () => {
    await server.stop();
  });
});
