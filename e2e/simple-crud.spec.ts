import { TestServer } from './test-server';
import { Tag } from '../src/models/product';
import { AllDefinitions, Hook } from '../lib/hook';
import { createParamDecorator } from '@nestjs/common';

type Context = any;

const beforeCreate = jest.fn();
const afterCreate = jest.fn();
const beforeFindOne = jest.fn();
const afterFindOne = jest.fn();
const afterFindMany = jest.fn();
const beforeFindMany = jest.fn();
const beforeUpdate = jest.fn();
const afterUpdate = jest.fn();
const beforeRemove = jest.fn();
const afterRemove = jest.fn();

@Hook(() => Tag)
class TagHook implements Hook<Tag, Context> {
  beforeCreate = beforeCreate;
  afterCreate = afterCreate;
  beforeFindOne = beforeFindOne;
  afterFindOne = afterFindOne;
  beforeFindMany = beforeFindMany;
  afterFindMany = afterFindMany;
  beforeUpdate = beforeUpdate;
  afterUpdate = afterUpdate;
  beforeRemove = beforeRemove;
  afterRemove = afterRemove;
}

@Hook(() => 'fake')
class FakeHook {}

@Hook(() => AllDefinitions)
class GeneralHook {}

const server = TestServer.init({
  definitions: [Tag],
  hooks: [TagHook, FakeHook, GeneralHook],
  contextDecorator: createParamDecorator(() => 'fakeContext'),
});

describe('Simple CRUD works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('Create tags', async () => {
    const names = ['70s', '80s', '90s'];
    for (const name of names) {
      await server.makeSuccessRequest({
        query: `
          mutation CreateTag($input: CreateTagInput!) {
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
      expect(beforeCreate).toBeCalledWith({ ctx: 'fakeContext', input: { name } });
      expect(afterCreate).toBeCalledWith({
        ctx: 'fakeContext',
        input: { name },
        created: expect.any(Object),
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

  it('paginate tags', async () => {
    const { paginateTags } = await server.makeSuccessRequest({
      query: `
        {
          paginateTags {
            docs {
              id
              name
            }
            totalDocs
            page
          }
        }
      `,
    });
    expect(paginateTags).toEqual({
      docs: [
        { id: expect.any(String), name: '70s' },
        { id: expect.any(String), name: '80s' },
        { id: expect.any(String), name: '90s' },
      ],
      totalDocs: 3,
      page: 1,
    });
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

  it('Update one tag', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation UpdateTag($input: UpdateTagInput!) {
          updateTag(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          id: allTags[0].id,
          name: '60s',
        },
      },
    });
    expect(response.updateTag.name).toEqual('60s');
  });

  it('Update not found tag', async () => {
    await server.makeFailRequest({
      query: `
        mutation UpdateTag($input: UpdateTagInput!) {
          updateTag(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          id: '000000000000000000000000',
          name: '80s',
        },
      },
      errorMessageMustContains: 'No Tag found with ID: 000000000000000000000000',
    });
  });

  it('Remove one tag and ensure it is gone', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation RemoveTag($id: ID!) {
          removeTag(id: $id) {
            success
          }
        }
      `,
      variables: {
        id: allTags[0].id,
      },
    });
    expect(response.removeTag.success).toEqual(true);

    // Try to fetch the removed tag by its ID
    await server.makeFailRequest({
      query: `
      query GetTag($id: ID!) {
        tag(id: $id) {
          name
        }
      }
      `,
      variables: {
        id: allTags[0].id,
      },
      errorMessageMustContains: `No Tag found with ID: ${allTags[0].id}`,
    });
  });

  it('Remove not found tag', async () => {
    await server.makeFailRequest({
      query: `
        mutation RemoveTag($id: ID!) {
          removeTag(id: $id) {
            success
          }
        }
      `,
      variables: {
        id: '000000000000000000000000',
      },
      errorMessageMustContains: 'No Tag found with ID: 000000000000000000000000',
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
