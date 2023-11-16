import { Definition } from './definition';
import { ObjectId } from './object-id';
import { RemoveOptions } from './remove-options';

export interface BulkErrorHandler<Context> {
  handleCreateError?(
    input: { ctx: Context; input: any; definition: Definition },
    error: Error,
  ): Promise<void>;
  handleUpdateError?(
    input: { ctx: Context; input: any; definition: Definition },
    error: Error,
  ): Promise<void>;
  handleRemoveError?(
    input: {
      ctx: Context;
      id: ObjectId;
      definition: Definition;
      options: RemoveOptions;
    },
    error: Error,
  ): Promise<void>;
}

export const BULK_ERROR_HANDLER = Symbol('BULK_ERROR_HANDLER');
