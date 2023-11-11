import { Definition, GraphQLObjectId, HasMany, Id, ObjectId, Property, Skip, Thunk } from '../../lib';
import { Transform } from 'class-transformer';

@Definition({ allowedApis: '*' })
export class Comment {
  @Id()
  id: ObjectId;

  @Property()
  content: string;

  @Property({ type: () => [GraphQLObjectId], create: Skip, update: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  variantId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Variant {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => [GraphQLObjectId], create: Skip, update: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  productId: ObjectId;

  @HasMany(() => Comment, { to: 'variantId' })
  comments: Comment[];
}
