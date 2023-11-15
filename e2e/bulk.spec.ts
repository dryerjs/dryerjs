import { TestServer } from './test-server';
import { Color, Tag } from '../src/models/product';

const server = TestServer.init({
  definitions: [Tag, Color],
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

  it('Bulk create tags with names that have whitespace', async () => {
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
        inputs: [{ name: '  C   ' }, { name: '     C' }, { name: '   D   ' }],
      },
    });

    expect(bulkCreateTags).toEqual([
      {
        input: { name: 'C' },
        success: true,
        errorMessage: null,
        result: { id: expect.any(String), name: 'C' },
      },
      {
        input: { name: 'C' },
        success: false,
        errorMessage: 'INTERNAL_SERVER_ERROR',
        result: null,
      },
      {
        input: { name: 'D' },
        success: true,
        errorMessage: null,
        result: { id: expect.any(String), name: 'D' },
      },
    ]);
  });

  it('Bulk create tags: return error if tag name exceed 100', async () => {
    const response = await server.makeFailRequest({
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
        inputs: [{ name: `${'a'.repeat(101)}` }, { name: `${'b'.repeat(101)}` }, { name: 'E' }],
      },
    });

    const errorMessage = response[0].extensions.originalError.message[0];

    expect(errorMessage).toEqual('name must be shorter than or equal to 100 characters');
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
          },
          {
            id: '000000000000000000000000',
            name: '70s',
          },
        ],
      },
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
      {
        input: { id: expect.any(String), name: '70s' },
        success: false,
        errorMessage: 'No Tag found with ID: 000000000000000000000000',
        result: null,
      },
    ]);
  });

  it('Bulk update tags with names that have whitespace', async () => {
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
            name: '       50s       ',
          },
          {
            id: allTags[1].id,
            name: '       60s',
          },
          {
            id: '000000000000000000000000',
            name: '70s',
          },
        ],
      },
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
      {
        input: { id: expect.any(String), name: '70s' },
        success: false,
        errorMessage: 'No Tag found with ID: 000000000000000000000000',
        result: null,
      },
    ]);
  });

  it('Bulk update tags: return error if tags name exceed 100', async () => {
    const response = await server.makeFailRequest({
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
            name: `50s${'a'.repeat(101)}`,
          },
          {
            id: allTags[1].id,
            name: '60s',
          },
          {
            id: '000000000000000000000000',
            name: '70s',
          },
        ],
      },
    });

    const errorMessage = response[0].extensions.originalError.message[0];
    expect(errorMessage).toEqual('name must be shorter than or equal to 100 characters');
  });

  it('Bulk remove tags', async () => {
    const { bulkRemoveTags } = await server.makeSuccessRequest({
      query: `
        mutation BulkRemoveTag($ids: [ObjectId!]!){
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
