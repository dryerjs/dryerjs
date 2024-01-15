import { TestServer } from './test-server';
import { Color, Tag } from '../src/models/product';
import { Injectable } from '@nestjs/common';
import { BulkErrorHandler, BULK_ERROR_HANDLER } from '../lib/bulk-error-handler';
import {
  BeforeCreateHook,
  BeforeCreateHookInput,
  BeforeUpdateHookInput,
  BeforeUpdateHook,
  BeforeRemoveHook,
  BeforeRemoveHookInput,
} from '../lib/hook';

const NEVER_CREATE_ME = 'NEVER_CREATE_ME';
const NEVER_UPDATE_ME = 'NEVER_UPDATE_ME';
const NEVER_REMOVE_ME = 'NEVER_REMOVE_ME';

@Injectable()
class TagHook {
  @BeforeCreateHook(() => Tag)
  async beforeCreate({ input }: BeforeCreateHookInput<Tag>): Promise<void> {
    if (input.name === NEVER_CREATE_ME) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @BeforeUpdateHook(() => Tag)
  async beforeUpdate({ input }: BeforeUpdateHookInput): Promise<void> {
    if (input.name === NEVER_UPDATE_ME) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  @BeforeRemoveHook(() => Tag)
  async beforeRemove({ beforeRemoved }: BeforeRemoveHookInput): Promise<void> {
    if (beforeRemoved.name === NEVER_REMOVE_ME) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }
}

const handleCreateError = jest.fn();
const handleUpdateError = jest.fn();
const handleRemoveError = jest.fn();

@Injectable()
class BulkErrorHandlerImpl<Context> implements BulkErrorHandler<Context> {
  handleCreateError = handleCreateError;
  handleUpdateError = handleUpdateError;
  handleRemoveError = handleRemoveError;
}

const server = TestServer.init({
  definitions: [Tag, Color],
  dryerProviders: [TagHook],
  appProviders: [
    {
      provide: BULK_ERROR_HANDLER,
      useClass: BulkErrorHandlerImpl,
    },
  ],
});

describe('bulk apis work', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('BulkErrorHandler works for beforeCreate', async () => {
    await server.makeSuccessRequest({
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
        inputs: [{ name: NEVER_CREATE_ME }],
      },
    });

    expect(handleCreateError).toBeCalledTimes(1);
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

  it('BulkErrorHandler works for beforeUpdate', async () => {
    await server.makeSuccessRequest({
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
            name: NEVER_UPDATE_ME,
          },
        ],
      },
    });
    expect(handleUpdateError).toBeCalledTimes(1);
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

  it('BulkErrorHandler works for beforeRemove', async () => {
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
        inputs: [{ name: NEVER_REMOVE_ME }],
      },
    });

    await server.makeSuccessRequest({
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
        ids: [bulkCreateTags[0].result.id],
      },
    });
    expect(handleRemoveError).toBeCalledTimes(1);
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
