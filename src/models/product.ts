import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { Field } from '@nestjs/graphql';
import {
  Property,
  Definition,
  ReferencesMany,
  ObjectId,
  Thunk,
  OutputType,
  CreateInputType,
  HasMany,
  HasOne,
} from '../../lib';
import { Variant } from './variant';
import { Image } from './image';

@Definition({ allowedApis: '*' })
export class Tag {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop({ unique: true })
  @Property(() => graphql.GraphQLString)
  name: string;
}

@Definition({ allowedApis: '*' })
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
  @Thunk(Field(() => [OutputType(Tag)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Tag)], { nullable: true }), { scopes: 'create' })
  tags: Tag[];

  @HasMany(() => Variant, { from: 'productId' })
  @Thunk(Field(() => [OutputType(Variant)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Variant)], { nullable: true }), { scopes: 'create' })
  variants: Variant[];

  @HasOne(() => Image, { to: 'productId' })
  @Thunk(Field(() => OutputType(Image)), { scopes: 'output' })
  @Thunk(Field(() => CreateInputType(Image), { nullable: true }), { scopes: 'create' })
  image: Image;
}
