import { TestServer } from './test-server';
import { Author, Color, Image, Product, Tag, User, Variant, Comment, Store } from '../src/models';
import { AuthResolver } from '../src/resolvers';

const server = TestServer.init({
  definitions: [User, Store, Product, Tag, Author, Variant, Image, Color, Comment],
  providers: [AuthResolver],
});

describe('Example app works', () => {
  beforeAll(async () => {
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
