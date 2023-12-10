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
  Ref,
  BelongsTo,
} from 'dryerjs';
import { MaxLength } from 'class-validator';

@Definition({ allowedApis: '*' })
export class Color {
  @Id()
  id: ObjectId;

  @Property()
  @Thunk(Transform(({ value }) => value.toLowerCase()), { scopes: 'output' })
  name: string;
}

@Definition({
  allowedApis: '*',
  removalConfig: {
    allowCleanUpRelationsAfterRemoved: true,
  },
})
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

  @ReferencesMany(() => Color, { from: 'colorIds', allowCreateWithin: true })
  colors: Color[];
}

@Definition({ allowedApis: '*' })
export class Image {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @BelongsTo(() => Product, { from: 'productId' })
  product: Ref<Product>;

  @Property({ type: () => GraphQLObjectId, update: Skip })
  productId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Comment {
  @Id()
  id: ObjectId;

  @Property()
  content: string;

  @Property({ type: () => GraphQLObjectId, update: Skip })
  variantId: ObjectId;

  @BelongsTo(() => Variant, { from: 'productId' })
  variant: Ref<Variant>;
}

@Definition({ allowedApis: '*' })
export class Store {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @HasMany(() => Product, {
    to: 'storeId',
    allowCreateWithin: false,
    allowFindAll: false,
    allowPaginate: false,
  })
  products: Product[];

  @ReferencesMany(() => Tag, { from: 'tagIds', allowCreateWithin: false, noPopulation: true })
  tags: Tag[];

  @Property({ type: () => [GraphQLObjectId], nullable: true, db: { type: [ObjectId], default: [] } })
  tagIds: ObjectId[];
}

@Definition({ allowedApis: '*' })
export class Variant {
  @Id()
  id: ObjectId;

  @Property()
  @Filterable(() => graphql.GraphQLString, { operators: ['eq'] })
  @Sortable()
  name: string;

  @Property({ type: () => GraphQLObjectId })
  productId: ObjectId;

  @BelongsTo(() => Product, { from: 'productId' })
  product: Ref<Product>;

  @HasMany(() => Comment, { to: 'variantId', allowCreateWithin: true, allowFindAll: true })
  comments: Comment[];
}

@Definition({
  allowedApis: '*',
  removalConfig: {
    allowIgnoreRelationCheck: true,
    allowCleanUpRelationsAfterRemoved: true,
  },
})
export class Product {
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  @Filterable(() => graphql.GraphQLString, { operators: ['eq'] })
  @Sortable()
  name: string;

  @Property({ type: () => [GraphQLObjectId], nullable: true, db: { type: [ObjectId], default: [] } })
  tagIds: ObjectId[];

  @ReferencesMany(() => Tag, { from: 'tagIds', allowCreateWithin: true, noPopulation: false })
  tags: Tag[];

  @HasMany(() => Variant, {
    to: 'productId',
    allowCreateWithin: true,
    allowFindAll: true,
    allowPaginate: true,
  })
  variants: Variant[];

  @HasOne(() => Image, { to: 'productId', allowCreateWithin: true })
  image: Image;

  @BelongsTo(() => Store, { from: 'storeId', noPopulation: true })
  store: Ref<Store>;

  @Property({ type: () => GraphQLObjectId, update: Skip, nullable: true })
  storeId: ObjectId;
}
