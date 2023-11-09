import * as graphql from 'graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { MaxLength, ValidateNested } from 'class-validator';
import { Field } from '@nestjs/graphql';

import {
  Property,
  Definition,
  Embedded,
  Thunk,
  OutputType,
  CreateInputType,
  UpdateInputType,
} from '../../lib';

@Definition()
@Schema({ toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Review {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  name: string;
}

@Definition()
@Schema({ toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Book {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  name: string;

  @Prop({ type: [SchemaFactory.createForClass(Review)] })
  @Thunk(Field(() => [OutputType(Review)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Review)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [UpdateInputType(Review)], { nullable: true }), { scopes: 'update' })
  @Thunk(Type(() => CreateInputType(Review)), { scopes: 'create' })
  @Thunk(Type(() => UpdateInputType(Review)), { scopes: 'update' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'create' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'update' })
  @Embedded(() => Review, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  reviews: Review[];
}

const bookSchema = SchemaFactory.createForClass(Book);
bookSchema.virtual('id').get(function () {
  return (this['_id'] as any).toHexString();
});

@Definition({ allowedApis: '*' })
export class Author {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: [bookSchema] })
  @Thunk(Field(() => [OutputType(Book)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Book)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [UpdateInputType(Book)], { nullable: true }), { scopes: 'update' })
  @Thunk(Type(() => CreateInputType(Book)), { scopes: 'create' })
  @Thunk(Type(() => UpdateInputType(Book)), { scopes: 'update' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'create' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'update' })
  @Embedded(() => Book, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  books: Book[];
}
