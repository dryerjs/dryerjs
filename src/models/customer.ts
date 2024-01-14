import * as graphql from 'graphql';
import {
  Definition,
  Thunk,
  Filterable,
  allOperators,
  Sortable,
  ObjectId,
  Property,
  Id,
  GraphQLObjectId,
  Index,
  BeforeReadFilterHookInput,
  BeforeReadFilter,
} from 'dryerjs';
import { IsEmail } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { User } from './user';

@Index({ name: 'text' })
@Definition({
  allowedApis: '*',
  enableTextSearch: true,
})
export class Customer {
  @Filterable(() => GraphQLObjectId, { operators: allOperators })
  @Sortable()
  @Id()
  id: ObjectId;

  @Filterable(() => graphql.GraphQLString, { operators: allOperators })
  @Sortable()
  @Property()
  name: string;

  @Thunk(IsEmail, { scopes: ['input'] })
  @Filterable(() => graphql.GraphQLString, { operators: allOperators })
  @Sortable()
  @Property({ nullable: true, db: { unique: true } })
  email: string;

  @Filterable(() => graphql.GraphQLInt, { operators: allOperators })
  @Property({ nullable: true })
  numberOfOrders?: number;

  @Filterable(() => GraphQLObjectId, { operators: allOperators })
  @Property({ type: () => GraphQLObjectId, nullable: true })
  countryId: ObjectId;
}

@Injectable()
export class CustomerService {
  @BeforeReadFilter(() => User)
  welcome(input: BeforeReadFilterHookInput<User>) {
    console.log('welcome', input);
  }
}
