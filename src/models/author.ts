import { Transform } from 'class-transformer';
import { MaxLength } from 'class-validator';
import { UseGuards } from '@nestjs/common';

import { Definition, Embedded, Thunk, ObjectId, Property, Id, Skip } from 'dryerjs';
import { UserGuard } from './fake-guards';

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

  @Embedded(() => Review, { allowedApis: ['create', 'update', 'remove', 'findOne', 'findAll'] })
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

@Definition({ allowedApis: '*' })
export class Author {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Embedded(() => Book, {
    allowedApis: ['create', 'update', 'remove', 'findOne', 'findAll'],
    resolverDecorators: { remove: UseGuards(UserGuard) },
  })
  books: Book[];

  @Embedded(() => Event, {
    allowedApis: [],
    overridePropertyOptions: { create: Skip, update: Skip },
  })
  events: Event[];
}
