import * as graphql from 'graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

import * as util from '../util';
import { Definition } from '../definition';
import { OutputType } from './output-type';
import { GraphQLObjectId, ObjectId } from '../shared';

function getType(definition: Definition): any {
  @ObjectType(`BulkRemove${util.plural(definition.name)}Result`)
  class Placeholder {
    // output as json.  search for scalar json
    @Field(() => GraphQLObjectId)
    @Transform(({ obj, key }) => obj[key])
    id: ObjectId;

    @Field(() => OutputType(definition), { nullable: true })
    result: boolean;

    @Field(() => graphql.GraphQLBoolean)
    success: boolean;

    @Field(() => graphql.GraphQLString, { nullable: true })
    errorMessage?: string;
  }
  return Placeholder;
}

export const BulkRemoveOutputType = util.memoize(getType);
