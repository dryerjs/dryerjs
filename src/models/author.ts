import { Transform } from 'class-transformer';
import { MaxLength } from 'class-validator';

import { Definition, Embedded, Thunk, ObjectId, Property, Id, Skip } from 'dryerjs';

@Definition()
export class Review {
  @Id()
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Property()
  content: string;
}

@Definition()
export class Book {
  @Id()
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Property()
  title: string;

  @Embedded(() => Review)
  reviews: Review[];
}

@Definition()
export class Event {
  @Id()
  id: ObjectId;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Property()
  name: string;
}

@Definition()
export class Author {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Embedded(() => Book)
  books: Book[];

  @Embedded(() => Event, {
    overridePropertyOptions: { create: Skip, update: Skip },
  })
  events: Event[];
}
