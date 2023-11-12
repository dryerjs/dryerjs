import * as graphql from 'graphql';
import { Transform } from 'class-transformer';
import {
  Definition,
  ReferencesMany,
  ObjectId,
  Thunk,
  Filterable,
  Sortable,
  HasMany,
  HasOne,
  GraphQLObjectId,
  Property,
  Skip,
  Id,
} from '../../lib';
import { MaxLength } from 'class-validator';

@Definition({ allowedApis: '*' })
export class Color {
  @Id()
  id: ObjectId;

  @Property()
  name: string;
}

@Definition({ allowedApis: '*' })
export class Tag {
  @Id()
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Property({ db: { unique: true } })
  name: string;

  @Property({
    type: () => [GraphQLObjectId],
    nullable: true,
    output: { nullable: false },
    db: { type: [ObjectId], default: [] },
  })
  colorIds: ObjectId[];

  @ReferencesMany(() => Color, { from: 'colorIds' })
  colors: Color[];
}

@Definition({ allowedApis: '*' })
export class Image {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => GraphQLObjectId, update: Skip })
  productId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Product {
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  @Filterable(() => graphql.GraphQLString, { operators: ['eq'] })
  @Sortable()
  name: string;

  @Property({ type: () => [GraphQLObjectId], nullable: true, db: { type: [ObjectId], default: [] } })
  tagIds: ObjectId[];

  @ReferencesMany(() => Tag, { from: 'tagIds' })
  tags: Tag[];

  @HasMany(() => Variant, { to: 'productId' })
  variants: Variant[];

  @HasOne(() => Image, { to: 'productId' })
  image: Image;
}

@Definition({ allowedApis: '*' })
export class Comment {
  @Id()
  id: ObjectId;

  @Property()
  content: string;

  @Property({ type: () => GraphQLObjectId, update: Skip })
  variantId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Variant {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => GraphQLObjectId, update: Skip })
  @Filterable(() => GraphQLObjectId, { operators: ['eq', 'in'] })
  productId: ObjectId;

  @HasMany(() => Comment, { to: 'variantId' })
  comments: Comment[];
}
