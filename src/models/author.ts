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
  @Prop()
  name: string;

  @Property(() => [Typer.getCreateInputType(Book)], { nullable: true })
  @Thunk(Field(() => [Typer.getObjectType(Book)]), { scopes: 'output' })
  @Prop({ type: [SchemaFactory.createForClass(Book)] })
  @Embedded(() => Book)
  books: Book[];
}
