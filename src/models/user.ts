import * as graphql from 'graphql';
import { IsEmail, MinLength } from 'class-validator';
import { Definition, Thunk, Filterable, ObjectId, Property, Skip, Id } from '../../lib';

@Definition({ allowedApis: '*' })
export class User {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Thunk(IsEmail(), { scopes: ['input'] })
  @Filterable(() => graphql.GraphQLString, { operators: ['eq', 'in'] })
  @Property({ db: { unique: true } })
  email: string;

  @Thunk(MinLength(5), { scopes: ['create'] })
  @Property({ output: Skip, update: Skip })
  password: string;
}
