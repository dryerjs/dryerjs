import * as graphql from 'graphql';
import { SchemaFactory } from '@nestjs/mongoose';
import { Field } from '@nestjs/graphql';
import { Property, Typer, Entity, Embedded, Thunk, OverrideDatabase } from '../../lib';

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

  @Thunk(Field(() => [Typer.getObjectType(Book)]), { scopes: 'output' })
  @Thunk(Field(() => [Typer.getCreateInputType(Book)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [Typer.getUpdateInputType(Book)], { nullable: true }), { scopes: 'update' })
  @Embedded(() => Book)
  @OverrideDatabase({ type: [SchemaFactory.createForClass(Book)] })
  books: Book[];
}
