import * as graphql from 'graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Field } from '@nestjs/graphql';
import { Property, Entity, Embedded, Thunk, OutputType, CreateInputType, UpdateInputType } from '../../lib';

@Entity()
export class Book {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;
}

@Entity()
export class Author {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: [SchemaFactory.createForClass(Book)] })
  @Thunk(Field(() => [OutputType(Book)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Book)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [UpdateInputType(Book)], { nullable: true }), { scopes: 'update' })
  @Embedded(() => Book)
  books: Book[];
}
