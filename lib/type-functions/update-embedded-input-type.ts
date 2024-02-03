import { Field } from '@nestjs/graphql';
import * as util from '../util';
import { GraphQLObjectId } from '../object-id';
import { BaseClassType, getBaseType } from './base';
import { inspect } from '../inspect';

function getType<T extends object>(definition: BaseClassType<T>): BaseClassType<T> {
  const result = getBaseType({
    definition,
    name: `UpdateEmbedded${definition.name}Input`,
    scope: 'update',
  });
  // const hasId = inspect(definition)
  //   .getProperties()
  //   .some((property) => property.name === 'id');

  // if (hasId) {
  // }
  Field(() => GraphQLObjectId, { nullable: true })(result.prototype, 'id');
  return result;
}

export const UpdateEmbeddedInputType = util.memoize(getType);
