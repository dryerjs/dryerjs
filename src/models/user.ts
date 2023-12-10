import * as graphql from 'graphql';
import { UseGuards } from '@nestjs/common';
import { IsEmail, MinLength } from 'class-validator';
import { Definition, Thunk, Filterable, ObjectId, Property, Skip, Id, Index } from 'dryerjs';
import { AdminGuard, UserGuard } from './fake-guards';

@Index({ email: 1 }, { unique: true, name: 'unique_email' })
@Index({ email: 'text', name: 'text' }, { name: 'searchable_user_index' })
@Definition({
  allowedApis: '*',
  enableTextSearch: true,
  resolverDecorators: {
    default: [UseGuards(UserGuard)],
    list: [UseGuards(AdminGuard)],
    write: [UseGuards(AdminGuard)],
    update: [UseGuards(UserGuard)],
  },
})
export class User {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Thunk(IsEmail(), { scopes: ['input'] })
  @Filterable(() => graphql.GraphQLString, { operators: ['eq', 'in'] })
  @Property()
  email: string;

  @Thunk(MinLength(5), { scopes: ['create'] })
  @Property({ output: Skip, update: Skip })
  password: string;
}
