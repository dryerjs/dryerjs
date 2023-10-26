import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { Field } from '@nestjs/graphql';
import { Property, Typer, Entity, ReferencesMany, ObjectId, Thunk } from '../../lib';

@Entity()
export class Tag {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;
}

@Entity()
export class Product {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  @Prop()
  name: string;

  @Prop({ type: [ObjectId], default: [] })
  @Thunk(Field(() => [graphql.GraphQLString], { nullable: true }), { scopes: 'input' })
  @Thunk(Field(() => [graphql.GraphQLString]), { scopes: 'output' })
  @Thunk(Type(() => String))
  @Thunk(
    Transform(({ value: tagIds }) => {
      return tagIds.map((tagId: string) => new Types.ObjectId(tagId));
    }),
    { scopes: 'input' },
  )
  tagIds: string[];

  @ReferencesMany(() => Tag, { from: 'tagIds' })
  @Thunk(Field(() => [Typer.for(Tag).output]), { scopes: 'output' })
  @Thunk(Field(() => [Typer.for(Tag).create], { nullable: true }), { scopes: 'create' })
  tags: Tag[];
}
