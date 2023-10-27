// create with bulk
// invalid validation error
// error case

import { TestServer } from './test-server';
import { Tag } from '../src/models/product';

const server = TestServer.init({
  definitions: [Tag],
});

describe('bulk create', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Bulk create tags', async () => {
    await server.makeSuccessRequest({
      query: `
      mutation BulkCreateTag($inputs: [CreateTagInput!]!) {
        bulkCreateTag(inputs: $inputs) {
          input
        }
      }
      `,
      variables: {
        inputs: [{ name: '70s' }, { name: '80s' }, { name: '90s' }],
      },
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
