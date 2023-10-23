import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import {
  OutputProperty,
  Property,
  Typer,
  Entity,
  ReferencesMany,
  ObjectId,
  Thunk,
} from '../../lib';
import { Type } from 'class-transformer';

@Entity()
export class Tag {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  @Prop()
  name: string;
}

@Entity()
export class Product {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  @Prop()
  name: string;

  @Property(() => [graphql.GraphQLString])
  @Prop({ type: [ObjectId], default: [] })
  @Thunk(Type(() => String))
  tagIds: string[];

  @ReferencesMany(() => Tag)
  @Property(() => [Typer.getCreateInputType(Tag)], { nullable: true })
  @OutputProperty(() => [Typer.getObjectType(Tag)])
  tags: Tag[];
}
