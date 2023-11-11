import { Transform } from 'class-transformer';
import { MaxLength } from 'class-validator';

import { Definition, Embedded, Thunk, ObjectId, GraphQLObjectId, Property, Skip } from '../../lib';

@Definition()
export class Review {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Property()
  name: string;
}

@Definition()
export class Book {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Property()
  name: string;

  @Embedded(() => Review, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  reviews: Review[];
}

@Definition({ allowedApis: '*' })
export class Author {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Property()
  name: string;

  @Embedded(() => Book, { allowApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
  books: Book[];
}
