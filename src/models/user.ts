import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { IsEmail, MinLength } from 'class-validator';
import { Property, Definition, Thunk, ExcludeOnDatabase, Filterable, Hook } from '../../lib';
import { Field } from '@nestjs/graphql';

@Definition({ allowedApis: '*' })
export class User {
  @Thunk(Field(() => graphql.GraphQLID), { scopes: ['output', 'update'] })
  @ExcludeOnDatabase()
  id: string;

  @Property()
  name: string;

  @Prop({ unique: true })
  @Thunk(Field(), { scopes: ['create', 'output'] })
  @Thunk(Field(() => graphql.GraphQLString, { nullable: true }), { scopes: 'update' })
  @Thunk(IsEmail(), { scopes: ['input'] })
  @Filterable(() => graphql.GraphQLString, { operators: ['eq', 'in'] })
  email: string;

  @Thunk(Field(), { scopes: ['create'] })
  @Thunk(MinLength(5), { scopes: ['create'] })
  password: string;
}

@Hook(() => User)
export class UserHook<T, Context> {
  public afterGetOne(ctx: Context, value: T) {
    console.log('afterGetOne', ctx, value);
  }
}
