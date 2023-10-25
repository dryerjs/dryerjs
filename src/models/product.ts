import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import {
  OutputProperty,
  Property,
  Typer,
  Entity,
  ReferencesMany,
  ObjectId,
  Thunk,
} from '../../lib';

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

  @Property(() => [graphql.GraphQLString], { nullable: true })
  @Prop({ type: [ObjectId], default: [] })
  @Thunk(Type(() => String))
  @Thunk(
    Transform(({ value: tagIds }) => {
      return tagIds.map((tagId: string) => new Types.ObjectId(tagId));
    }),
    { scopes: 'input' },
  )
  tagIds: string[];

  @ReferencesMany(() => Tag, { from: 'tagIds' })
  @Property(() => [Typer.getCreateInputType(Tag)], { nullable: true })
  @OutputProperty(() => [Typer.getObjectType(Tag)])
  tags: Tag[];
}
