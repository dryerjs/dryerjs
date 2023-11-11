import * as graphql from 'graphql';
import {
  Definition,
  Thunk,
  Filterable,
  allOperators,
  Sortable,
  Property,
  GraphQLObjectId,
  ObjectId,
} from '../../lib';
import { Prop } from '@nestjs/mongoose';
import { IsEmail } from 'class-validator';
import { Field } from '@nestjs/graphql';

@Definition({ allowedApis: '*' })
export class Customer {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Thunk(Field(() => graphql.GraphQLString), { scopes: ['create', 'update', 'output'] })
  @Filterable(() => graphql.GraphQLString, { operators: allOperators })
  @Sortable()
  name: string;

  @Prop({ unique: true })
  @Thunk(Field(), { scopes: ['create', 'output'] })
  @Thunk(Field(() => graphql.GraphQLString, { nullable: true }), { scopes: 'update' })
  @Thunk(IsEmail, { scopes: ['input'] })
  @Filterable(() => graphql.GraphQLString, { operators: allOperators })
  @Sortable()
  email: string;

  @Thunk(Field(() => graphql.GraphQLInt, { nullable: true }), { scopes: ['create', 'output', 'update'] })
  @Filterable(() => graphql.GraphQLInt, { operators: allOperators })
  numberOfOrders: number;
}
