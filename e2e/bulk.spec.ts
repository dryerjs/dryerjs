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

  it('Bulk update tags', async () => {
    const { bulkUpdateTags } = await server.makeSuccessRequest({
      query: `
        mutation bulkUpdateTags($inputs: [UpdateTagInput!]!){
          bulkUpdateTags(inputs: $inputs){
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
        inputs: [
        {
          id: allTags[0].id,
          name: '50s',
        },
        {
          id: allTags[1].id,
          name: '60s',
        }
      ]},
    });

    expect(bulkUpdateTags).toEqual([
      {
        input: { id: expect.any(String), name: '50s' },
        success: true,
        errorMessage: null,
        result: { id: expect.any(String), name: '50s' },        
      },
      {
        input: { id: expect.any(String), name: '60s' },
        success: true,
        errorMessage: null,
        result: { id: expect.any(String), name: '60s' },  
      },
    ]);
  });

  it('Bulk delete tags', async () => {
    const { bulkRemoveTags } = await server.makeSuccessRequest({
      query: `
        mutation BulkRemoveTag($ids: [ID!]!){
          bulkRemoveTags(ids: $ids){
            id
            success
            errorMessage
          }
        }
      `,
      variables: {
        ids: [allTags[0].id, allTags[1].id, allTags[1].id],
      },
    });

    expect(bulkRemoveTags).toEqual([
      {
        id: allTags[0].id,
        success: true,
        errorMessage: null,
      },
      {
        id: allTags[1].id,
        success: true,
        errorMessage: null,
      },
      {
        id: allTags[1].id,
        success: false,
        errorMessage: 'No Tag found with ID: ' + allTags[1].id,
      },
    ]);
  });

  afterAll(async () => {
    await server.stop();
  });
});
