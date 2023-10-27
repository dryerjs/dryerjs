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

  afterAll(async () => {
    await server.stop();
  });
});
