import * as graphql from 'graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { OutputProperty, Property, Typer, Entity, Embedded } from '../../lib';

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
  @OutputProperty(() => [Typer.getObjectType(Book)])
  @Prop({ type: [SchemaFactory.createForClass(Book)] })
  @Embedded(() => Book)
  books: Book[];
}
