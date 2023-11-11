import { Definition, GraphQLObjectId, HasMany, Id, ObjectId, Property, Skip } from '../../lib';

@Definition({ allowedApis: '*' })
export class Comment {
  @Id()
  id: ObjectId;

  @Property()
  content: string;

  @Property({ type: () => [GraphQLObjectId], create: Skip, update: Skip })
  variantId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Variant {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => [GraphQLObjectId], create: Skip, update: Skip })
  productId: ObjectId;

  @HasMany(() => Comment, { to: 'variantId' })
  comments: Comment[];
}
