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
} from '../../lib';
import { MaxLength } from 'class-validator';
import { Variant } from './variant';

@Definition({ allowedApis: '*' })
export class Color {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Property()
  name: string;
}

@Definition({ allowedApis: '*' })
export class Tag {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
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
  @Thunk(Transform(({ obj, key }) => obj[key]))
  colorIds: ObjectId[];

  @ReferencesMany(() => Color, { from: 'colorIds' })
  colors: Color[];
}

@Definition({ allowedApis: '*' })
export class Image {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => [GraphQLObjectId], create: Skip, update: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  productId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Product {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  @Filterable(() => graphql.GraphQLString, { operators: ['eq'] })
  @Sortable()
  name: string;

  @Property({ type: () => [GraphQLObjectId], nullable: true, db: { type: [ObjectId], default: [] } })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  tagIds: ObjectId[];

  @ReferencesMany(() => Tag, { from: 'tagIds' })
  tags: Tag[];

  @HasMany(() => Variant, { to: 'productId' })
  variants: Variant[];

  @HasOne(() => Image, { to: 'productId' })
  image: Image;
}
