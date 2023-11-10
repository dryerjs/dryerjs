import { Prop } from '@nestjs/mongoose';
import {
  CreateInputType,
  Definition,
  ExcludeOnDatabase,
  HasMany,
  ObjectId,
  OutputType,
  Property,
  Thunk,
} from '../../lib';
import * as graphql from 'graphql';
import { Field } from '@nestjs/graphql';

@Definition({ allowedApis: '*' })
export class Comment {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop()
  @Thunk(Field(() => graphql.GraphQLString))
  content: string;

  @Prop({ type: ObjectId })
  @Thunk(Field(() => graphql.GraphQLID), { scopes: 'output' })
  variantId: string;
}

@Definition({ allowedApis: '*' })
export class Variant {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop()
  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: ObjectId })
  @Thunk(Field(() => graphql.GraphQLID), { scopes: 'output' })
  productId: string;

  @HasMany(() => Comment, { to: 'variantId' })
  @Thunk(Field(() => [OutputType(Comment)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Comment)], { nullable: true }), { scopes: 'create' })
  @ExcludeOnDatabase()
  comments: Comment[];
}
