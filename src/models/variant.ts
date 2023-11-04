import { Prop } from '@nestjs/mongoose';
import { Definition, ObjectId, Property, Thunk, Filterable, Sortable, allOperators } from '../../lib';
import * as graphql from 'graphql';
import { Field } from '@nestjs/graphql';

@Definition({ allowedApis: '*' })
export class Variant {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop()
  @Property(() => graphql.GraphQLString)
  @Filterable(() => graphql.GraphQLString, { operators: allOperators })
  @Sortable()
  name: string;

  @Prop({
    type: ObjectId,
  })
  @Thunk(Field(() => graphql.GraphQLID), { scopes: 'output' })
  productId: string;
}
