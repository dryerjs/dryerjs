import * as graphql from 'graphql';
import { Transform } from 'class-transformer';
import { MaxLength } from 'class-validator';
import { Field } from '@nestjs/graphql';

import { Property, Definition, Embedded, Thunk, ObjectId, GraphQLObjectId } from '../../lib';

@Definition()
export class Review {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  name: string;
}

@Definition()
export class Book {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  name: string;

  @Embedded(() => Review, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  reviews: Review[];
}

@Definition({ allowedApis: '*' })
export class Author {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Embedded(() => Book, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  books: Book[];
}
