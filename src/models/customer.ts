import * as graphql from 'graphql';
import {
  Definition,
  Thunk,
  Filterable,
  allOperators,
  Sortable,
  GraphQLObjectId,
  ObjectId,
  Property,
  Skip,
} from '../../lib';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

@Definition({ allowedApis: '*' })
export class Customer {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
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
  numberOfOrders: number;
}
