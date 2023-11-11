import * as graphql from 'graphql';
import { IsEmail, MinLength } from 'class-validator';
import { Definition, Thunk, Filterable, GraphQLObjectId, ObjectId, Property, Skip } from '../../lib';
import { Transform } from 'class-transformer';

@Definition({ allowedApis: '*' })
export class User {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
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
