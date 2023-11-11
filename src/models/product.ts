import * as graphql from 'graphql';
import { Prop } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { Field } from '@nestjs/graphql';
import {
  Property,
  Definition,
  ReferencesMany,
  ObjectId,
  Thunk,
  Filterable,
  Sortable,
  HasMany,
  ExcludeOnDatabase,
  HasOne,
  GraphQLObjectId,
} from '../../lib';
import { MaxLength } from 'class-validator';
import { Variant } from './variant';

@Definition({ allowedApis: '*' })
export class Color {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Thunk(Field(() => graphql.GraphQLString))
  name: string;
}

@Definition({ allowedApis: '*' })
export class Tag {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Prop({ unique: true })
  @Thunk(Field(() => graphql.GraphQLString))
  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  name: string;

  @Prop({ type: [ObjectId], default: [] })
  @Thunk(Field(() => [GraphQLObjectId], { nullable: true }), { scopes: 'input' })
  @Thunk(Field(() => [GraphQLObjectId]), { scopes: 'output' })
  @ExcludeOnDatabase()
  @Thunk(Transform(({ obj, key }) => obj[key]))
  colorIds: ObjectId[];

  @ReferencesMany(() => Color, { from: 'colorIds' })
  colors: Color[];
}

@Definition({ allowedApis: '*' })
export class Image {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Prop()
  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: ObjectId })
  @Thunk(Field(() => GraphQLObjectId), { scopes: 'output' })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  productId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Product {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Property(() => graphql.GraphQLString)
  @Filterable(() => graphql.GraphQLString, { operators: ['eq'] })
  @Sortable()
  @Prop()
  name: string;

  @Prop({ type: [ObjectId], default: [] })
  @Thunk(Field(() => [GraphQLObjectId], { nullable: true }), { scopes: 'input' })
  @Thunk(Field(() => [GraphQLObjectId]), { scopes: 'output' })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  tagIds: ObjectId[];

  @ReferencesMany(() => Tag, { from: 'tagIds' })
  tags: Tag[];

  @HasMany(() => Variant, { to: 'productId' })
  variants: Variant[];

  @HasOne(() => Image, { to: 'productId' })
  image: Image;
}
