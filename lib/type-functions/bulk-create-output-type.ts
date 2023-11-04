import * as graphql from 'graphql';
import { ObjectType, Field } from '@nestjs/graphql';

import * as util from '../util';
import { Definition } from '../definition';
import { GraphQLJSONObject } from '../js/graphql-type-json';
import { OutputType } from './output-type';

function getType(definition: Definition): any {
  @ObjectType(`BulkCreate${util.plural(definition.name)}Result`)
  class Placeholder {
    // output as json.  search for scalar json
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

export const BulkCreateOutputType = util.memoize(getType);
