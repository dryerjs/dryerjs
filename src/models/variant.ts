import { Prop } from '@nestjs/mongoose';
import {
  CreateInputType,
  Definition,
  ExcludeOnDatabase,
  GraphQLObjectId,
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
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Prop()
  @Thunk(Field(() => graphql.GraphQLString))
  content: string;

  @Prop({ type: ObjectId })
  @Thunk(Field(() => GraphQLObjectId), { scopes: 'output' })
  variantId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Variant {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Prop()
  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: ObjectId })
  @Thunk(Field(() => GraphQLObjectId), { scopes: 'output' })
  productId: ObjectId;

  @HasMany(() => Comment, { to: 'variantId' })
  @Thunk(Field(() => [OutputType(Comment)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Comment)], { nullable: true }), { scopes: 'create' })
  @ExcludeOnDatabase()
  comments: Comment[];
}
