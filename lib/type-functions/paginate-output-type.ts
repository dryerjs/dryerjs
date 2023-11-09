import * as graphql from 'graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';

import * as util from '../util';
import { Definition } from '../definition';
import { OutputType } from './output-type';

function getType(definition: Definition): any {
  @ObjectType(`Paginated${util.plural(definition.name)}`)
  class Placeholder {
    @Field(() => [OutputType(definition)])
    @Type(/* istanbul ignore next */ () => OutputType(definition))
    docs: any[];

    @Field(() => graphql.GraphQLInt)
    totalDocs: number;

    @Field(() => graphql.GraphQLInt)
    page: number;

    @Field(() => graphql.GraphQLInt)
    limit: number;

    @Field(() => graphql.GraphQLInt)
    totalPages: number;

    @Field(() => graphql.GraphQLBoolean)
    hasNextPage: boolean;

    @Field(() => graphql.GraphQLInt)
    nextPage: number;

    @Field(() => graphql.GraphQLBoolean)
    hasPrevPage: boolean;

    @Field(() => graphql.GraphQLInt)
    prevPage: number;

    @Field(() => graphql.GraphQLInt)
    pagingCounter: number;
  }
  return Placeholder;
}

export const PaginatedOutputType = util.memoize(getType);
