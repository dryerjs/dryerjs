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
  Filterable,
  Sortable,
  HasMany,
  ExcludeOnDatabase,
  HasOne,
} from '../../lib';
import { MaxLength } from 'class-validator';
import { Variant } from './variant';

@Definition({ allowedApis: '*' })
export class Color {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Thunk(Field(() => graphql.GraphQLString))
  name: string;
}

@Definition({ allowedApis: '*' })
export class Tag {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop({ unique: true })
  @Thunk(Field(() => graphql.GraphQLString))
  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  name: string;

  @ReferencesMany(() => Color, { from: 'colorIds' })
  @Thunk(Field(() => [OutputType(Color)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Color)], { nullable: true }), { scopes: 'create' })
  colors: Color[];

  @Prop({ type: [ObjectId], default: [] })
  @Thunk(Field(() => [graphql.GraphQLString], { nullable: true }), { scopes: 'input' })
  @Thunk(Field(() => [graphql.GraphQLString]), { scopes: 'output' })
  @Thunk(Type(() => String))
  @Thunk(
    Transform(({ value: tagIds }) => {
      return tagIds.map((tagId: string) => new Types.ObjectId(tagId));
    }),
    {
      scopes: 'input',
    },
  )
  @ExcludeOnDatabase()
  colorIds: string[];
}

@Definition({ allowedApis: '*' })
export class Image {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop()
  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({
    type: ObjectId,
  })
  @Thunk(Field(() => graphql.GraphQLID), { scopes: 'output' })
  productId: string;
}

@Definition({ allowedApis: '*' })
export class Product {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  @Filterable(() => graphql.GraphQLString, { operators: ['eq'] })
  @Sortable()
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
  @ExcludeOnDatabase()
  tagIds: string[];

  @ReferencesMany(() => Tag, { from: 'tagIds' })
  @Thunk(Field(() => [OutputType(Tag)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Tag)], { nullable: true }), { scopes: 'create' })
  tags: Tag[];

  @HasMany(() => Variant, { from: 'productId' })
  @Thunk(Field(() => [OutputType(Variant)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Variant)], { nullable: true }), { scopes: 'create' })
  @ExcludeOnDatabase()
  variants: Variant[];

  @HasOne(() => Image, { to: 'productId' })
  @Thunk(Field(() => OutputType(Image), { nullable: true }), { scopes: 'output' })
  @Thunk(Field(() => CreateInputType(Image), { nullable: true }), { scopes: 'create' })
  @ExcludeOnDatabase()
  image: Image;
}
