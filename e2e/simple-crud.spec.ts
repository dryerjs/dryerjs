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

  it('Create tags', async () => {
    const names = ['70s', '80s', '90s'];
    for (const name of names) {
      await server.makeSuccessRequest({
        query: `
          mutation CreateTag($input: TagInput!) {
            createTag(input: $input) {
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
    }
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
    expect(allTags).toEqual([
      { id: expect.any(String), name: '70s' },
      { id: expect.any(String), name: '80s' },
      { id: expect.any(String), name: '90s' },
    ]);
  });

  it('Get one tag', async () => {
    const response = await server.makeSuccessRequest({
      query: `
      query GetTag($id: ID!) {
        tag(id: $id) {
          id
          name
        }
      }
      `,
      variables: {
        id: allTags[0].id,
      },
    });
    expect(response.tag.name).toEqual(allTags[0].name);
  });

  afterAll(async () => {
    await server.stop();
  });
});
