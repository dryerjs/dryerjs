import * as graphql from 'graphql';
import { Transform } from 'class-transformer';
import { MaxLength } from 'class-validator';
import { Field } from '@nestjs/graphql';

import { Property, Definition, Embedded, Thunk } from '../../lib';

@Definition()
export class Review {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  name: string;
}

@Definition()
export class Book {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  name: string;

  @Embedded(() => Review, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  reviews: Review[];
}

@Definition({ allowedApis: '*' })
export class Author {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Embedded(() => Book, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  books: Book[];
}
