import * as graphql from 'graphql';
import { ObjectType, Field } from '@nestjs/graphql';

import * as util from '../util';
import { Definition } from '../definition';
import { OutputType } from './output-type';

function getType(definition: Definition): any {
  @ObjectType(`BulkRemove${util.plural(definition.name)}Result`)
  class Placeholder {
    // output as json.  search for scalar json
    @Field(() => graphql.GraphQLID)
    id: object;

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
