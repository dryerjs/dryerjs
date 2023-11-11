import { Definition, GraphQLObjectId, HasMany, ObjectId, Property, Skip, Thunk } from '../../lib';
import { Transform } from 'class-transformer';

@Definition({ allowedApis: '*' })
export class Comment {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Property()
  content: string;

  @Property({ type: () => [GraphQLObjectId], create: Skip, update: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  variantId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Variant {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => [GraphQLObjectId], create: Skip, update: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  productId: ObjectId;

  @HasMany(() => Comment, { to: 'variantId' })
  comments: Comment[];
}
