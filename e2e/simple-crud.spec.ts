import { TestServer } from './test-server';
import { Tag, Color } from '../src/models/product';
import {
  AfterCreateHook,
  AfterFindManyHook,
  AfterFindOneHook,
  AfterRemoveHook,
  AfterUpdateHook,
  BeforeCreateHook,
  BeforeFindManyHook,
  BeforeFindOneHook,
  BeforeReadFilterHook,
  BeforeRemoveHook,
  BeforeUpdateHook,
  BeforeWriteFilterHook,
} from '../lib/hook';
import { Injectable, createParamDecorator } from '@nestjs/common';
import { ObjectId } from '../lib/object-id';
import { RemoveMode } from '../lib/remove-options';
import { getBaseServiceToken } from '../lib/base.service';

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
const beforeReadFilter = jest.fn();
const beforeWriteFilter = jest.fn();

@Injectable()
class TagHook {
  @BeforeCreateHook(() => Tag)
  beforeCreate(input: any) {
    beforeCreate(input);
  }

  @AfterCreateHook(() => Tag)
  afterCreate(input: any) {
    afterCreate(input);
  }

  @BeforeFindOneHook(() => Tag)
  beforeFindOne(input: any) {
    beforeFindOne(input);
  }

  @AfterFindOneHook(() => Tag)
  afterFindOne(input: any) {
    afterFindOne(input);
  }

  @BeforeFindManyHook(() => Tag)
  beforeFindMany(input: any) {
    beforeFindMany(input);
  }

  @AfterFindManyHook(() => Tag)
  afterFindMany(input: any) {
    afterFindMany(input);
  }

  @BeforeUpdateHook(() => Tag)
  beforeUpdate(input: any) {
    beforeUpdate(input);
  }

  @AfterUpdateHook(() => Tag)
  afterUpdate(input: any) {
    afterUpdate(input);
  }

  @BeforeRemoveHook(() => Tag)
  beforeRemove(input: any) {
    beforeRemove(input);
  }

  @AfterRemoveHook(() => Tag)
  afterRemove(input: any) {
    afterRemove(input);
  }

  @BeforeReadFilterHook(() => Tag)
  beforeReadFilter(input: any) {
    beforeReadFilter(input);
  }

  @BeforeWriteFilterHook(() => Tag)
  beforeWriteFilter(input: any) {
    beforeWriteFilter(input);
  }
}

const onSchema = jest.fn();

@Injectable()
class FakeHook {}

@Injectable()
class GeneralHook {}

const server = TestServer.init({
  definitions: [Tag, Color],
  dryerProviders: [TagHook, FakeHook, GeneralHook],
  contextDecorator: createParamDecorator(() => 'fakeContext'),
  onSchema,
  resolverConfigs: [
    { definition: Tag, allowedApis: '*' },
    { definition: Color, allowedApis: '*' },
  ],
});

describe('Simple CRUD works', () => {
  beforeAll(async () => {
    await server.start();
  });

  beforeEach(() => {
    [
      beforeCreate,
      afterCreate,
      beforeFindOne,
      afterFindOne,
      afterFindMany,
      beforeFindMany,
      beforeUpdate,
      afterUpdate,
      beforeRemove,
      afterRemove,
      beforeReadFilter,
      beforeWriteFilter,
    ].forEach((mock) => mock.mockClear());
  });

  it('onSchema is called', () => expect(onSchema).toBeCalled());

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
      expect(beforeCreate).toBeCalledWith({ ctx: 'fakeContext', input: { name }, definition: Tag });
      expect(afterCreate).toBeCalledWith({
        ctx: 'fakeContext',
        input: { name },
        created: expect.objectContaining({ name }),
        definition: Tag,
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
    expect(beforeReadFilter).toBeCalledWith({
      ctx: 'fakeContext',
      filter: {},
      definition: Tag,
    });
    expect(beforeFindMany).toBeCalledWith({
      ctx: 'fakeContext',
      filter: {},
      sort: {},
      definition: Tag,
    });
    expect(afterFindMany).toBeCalledWith({
      ctx: 'fakeContext',
      filter: {},
      sort: {},
      items: [
        expect.objectContaining({ name: '70s' }),
        expect.objectContaining({ name: '80s' }),
        expect.objectContaining({ name: '90s' }),
      ],
      definition: Tag,
    });
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
    expect(beforeReadFilter).toBeCalledWith({
      ctx: 'fakeContext',
      filter: {},
      definition: Tag,
    });
  });

  it('Get one tag', async () => {
    const id = allTags[0].id;
    const response = await server.makeSuccessRequest({
      query: `
        query GetTag($id: ObjectId!) {
          tag(id: $id) {
            id
            name
          }
        }
      `,
      variables: {
        id,
      },
    });
    expect(beforeReadFilter).toBeCalledWith({
      ctx: 'fakeContext',
      filter: { _id: new ObjectId(id) },
      definition: Tag,
    });
    expect(beforeFindOne).toBeCalledWith({
      ctx: 'fakeContext',
      filter: expect.objectContaining({ _id: new ObjectId(id) }),
      definition: Tag,
    });
    expect(afterFindOne).toBeCalledWith({
      ctx: 'fakeContext',
      filter: expect.objectContaining({ _id: new ObjectId(id) }),
      result: expect.objectContaining({ name: '70s' }),
      definition: Tag,
    });
    expect(response.tag.name).toEqual(allTags[0].name);
  });

  it('Update one tag', async () => {
    const input: PartialTag = { id: allTags[0].id, name: '60s' };
    const response = await server.makeSuccessRequest({
      query: `
        mutation UpdateTag($input: UpdateTagInput!) {
          updateTag(input: $input) {
            id
            name
          }
        }
      `,
      variables: { input },
    });
    expect(response.updateTag.name).toEqual('60s');

    type PartialTag = Partial<Tag>;
    expect(beforeWriteFilter).toBeCalledWith({
      ctx: 'fakeContext',
      filter: {
        _id: new ObjectId(allTags[0].id),
      },
      definition: Tag,
    });
    expect(beforeUpdate).toBeCalledWith({
      ctx: 'fakeContext',
      input: { id: new ObjectId(allTags[0].id), name: '60s' },
      beforeUpdated: expect.objectContaining({ name: '70s' }),
      definition: Tag,
    });
    expect(afterUpdate).toBeCalledWith({
      ctx: 'fakeContext',
      input: { id: new ObjectId(allTags[0].id), name: '60s' },
      updated: expect.objectContaining({ name: '60s' }),
      beforeUpdated: expect.objectContaining({ name: '70s' }),
      definition: Tag,
    });
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
        mutation RemoveTag($id: ObjectId!) {
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
    expect(beforeWriteFilter).toBeCalledWith({
      ctx: 'fakeContext',
      filter: {
        _id: new ObjectId(allTags[0].id),
      },
      definition: Tag,
    });
    expect(beforeRemove).toBeCalledWith({
      ctx: 'fakeContext',
      beforeRemoved: expect.objectContaining({ name: '60s' }),
      definition: Tag,
      options: { mode: RemoveMode.RequiredCleanRelations },
    });
    expect(afterRemove).toBeCalledWith({
      ctx: 'fakeContext',
      removed: expect.objectContaining({ name: '60s' }),
      options: { mode: RemoveMode.RequiredCleanRelations },
      definition: Tag,
    });

    // Try to fetch the removed tag by its ID
    await server.makeFailRequest({
      query: `
      query GetTag($id: ObjectId!) {
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
        mutation RemoveTag($id: ObjectId!) {
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

  it('findOneNullable', async () => {
    const tagService = server.app.get(getBaseServiceToken(Tag), { strict: false });
    const nullValue = await tagService.findOneNullable('fakeContext', {
      _id: new ObjectId('000000000000000000000000'),
    });
    expect(nullValue).toBeNull();
  });

  it('findByIdNullable', async () => {
    const tagService = server.app.get(getBaseServiceToken(Tag), { strict: false });
    const nullValue = await tagService.findByIdNullable('fakeContext', {
      _id: new ObjectId('000000000000000000000000'),
    });
    expect(nullValue).toBeNull();
  });

  it('findOne', async () => {
    const tagService = server.app.get(getBaseServiceToken(Tag), { strict: false });
    try {
      await tagService.findOne('fakeContext', {
        name: 'not found',
      });
    } catch (error: any) {
      expect(error.message).toEqual('No Tag found');
    }
  });

  afterAll(async () => {
    await server.stop();
  });
});
