import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { IsEmail, MinLength } from 'class-validator';
import { Property, Entity, Thunk } from '../../lib';

@Entity()
export class User {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  @Prop()
  name: string;

  @Property()
  @Prop({ unique: true })
  @Thunk(IsEmail(), { scopes: ['input'] })
  email: string;

  @Property()
  @Prop()
  @Thunk(MinLength(5), { scopes: ['create'] })
  password: string;
}
