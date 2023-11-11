/* istanbul ignore next */
import * as Mongoose from 'mongoose';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import { GraphQLError } from 'graphql/error';

export type ObjectId = Mongoose.Types.ObjectId;
export const ObjectId = Mongoose.Types.ObjectId;

function isValidMongoDBObjectID(id: string): boolean {
  const normalizedId = String(id);
  if (normalizedId.length === 12 || normalizedId.length === 24) {
    return /^[0-9a-fA-F]+$/.test(normalizedId);
  }
  return false;
}

export const GraphQLObjectId = new GraphQLScalarType({
  name: 'ObjectId',
  description: 'ObjectId is a mongodb ObjectId. String of 12 or 24 hex chars',

  // from database towards client
  serialize(value: any): string {
    const isInvalidType = !(
      value instanceof ObjectId ||
      typeof value === 'string' ||
      value instanceof String
    );
    const result = String(value);
    if (isInvalidType) {
      throw new GraphQLError(`serialize: value: ${result} is not valid ObjectId`);
    }

    if (!isValidMongoDBObjectID(result)) {
      throw new GraphQLError(`serialize: value: ${value} is not valid ObjectId`);
    }

    return result;
  },

  // json from client towards database
  parseValue(value): ObjectId {
    if (!isValidMongoDBObjectID(value as string)) {
      throw new GraphQLError(
        'parseValue: not a valid ObjectId string, require a string with 12 or 24 hex chars, found: ' + value,
      );
    }

    return new ObjectId(value as string);
  },

  // AST from client towards database
  parseLiteral(ast): ObjectId {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        'parseLiteral: not a valid ObjectId string, require a string with 12 or 24 hex chars, found: ' +
          ast.kind,
      );
    }

    const value = ast.value.toString();
    return new ObjectId(value);
  },
});
