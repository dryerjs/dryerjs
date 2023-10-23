import { TestServer } from './test-server';
import { Author, Product, Tag, User } from '../src/models';
import { AuthResolver } from '../src/resolvers';

const server = TestServer.init({
  definitions: [User, Product, Tag, Author],
  providers: [AuthResolver],
});

describe('Simple CRUD works', () => {
  beforeEach(async () => {
    await server.start();
  });

  it('Get all tags', async () => {
    const { allTags } = await server.makeSuccessRequest({
      query: '{ allTags { name } }',
    });
    expect(allTags).toEqual([]);
  });

  afterAll(async () => {
    await server.stop();
  });
});
