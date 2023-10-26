import * as graphql from 'graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Field } from '@nestjs/graphql';
import { Property, Typer, Entity, Embedded, Thunk } from '../../lib';

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
  @Thunk(Field(() => [Typer.getObjectType(Book)]), { scopes: 'output' })
  @Thunk(Field(() => [Typer.getCreateInputType(Book)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [Typer.getUpdateInputType(Book)], { nullable: true }), { scopes: 'update' })
  @Embedded(() => Book)
  books: Book[];
}
