import * as graphql from 'graphql';
import { IsEmail, MinLength } from 'class-validator';
import { Definition, Thunk, Filterable, ObjectId, Property, Skip, Id, Index } from 'dryerjs';

@Index({ email: 1 }, { unique: true, name: 'unique_email' })
@Index({ email: 'text', name: 'text' }, { name: 'searchable_user_index' })
@Definition({
  enableTextSearch: true,
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
