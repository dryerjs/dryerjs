import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { IsEmail, MinLength } from 'class-validator';
import { Property, Entity, Thunk, ExcludeOnDatabase, ExcludeOnCreate } from '../../lib';
import { Field } from '@nestjs/graphql';

@Entity()
export class User {
  @Thunk(Field(() => graphql.GraphQLID))
  @ExcludeOnDatabase()
  @ExcludeOnCreate()
  id: string;

  @Property()
  name: string;

  @Property()
  @Prop({ unique: true })
  @Thunk(IsEmail(), { scopes: ['input'] })
  email: string;

  @Property()
  @Thunk(MinLength(5), { scopes: ['create'] })
  password: string;
}

// @Thunk should be applied before Property which do the rest
// @ExcludeOnDatabase()
