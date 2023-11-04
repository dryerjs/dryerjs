import { Prop } from '@nestjs/mongoose';
import { Definition, ObjectId, Property, Thunk } from '../../lib';
import * as graphql from 'graphql';
import { Field } from '@nestjs/graphql';

@Definition({ allowedApis: '*' })
export class Variant {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop()
  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({
    type: ObjectId,
  })
  @Thunk(Field(() => graphql.GraphQLID), { scopes: 'output' })
  productId: string;
}
