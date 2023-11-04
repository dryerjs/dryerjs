import * as graphql from 'graphql';
import { ObjectType, Field } from '@nestjs/graphql';

import * as util from '../util';
import { Definition } from '../definition';
import { GraphQLJSONObject } from '../js/graphql-type-json';
import { OutputType } from './output-type';

function getType(definition: Definition): any {
  @ObjectType(`BulkUpdate${util.plural(definition.name)}Result`)
  class Placeholder {
    @Field(() => GraphQLJSONObject)
    input: object;

    @Field(() => OutputType(definition), { nullable: true })
    result: boolean;

    @Field(() => graphql.GraphQLBoolean)
    success: boolean;

    @Field(() => graphql.GraphQLString, { nullable: true })
    errorMessage?: string;
  }
  return Placeholder;
}

export const BulkUpdateOutputType = util.memoize(getType);
