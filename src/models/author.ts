import * as graphql from 'graphql';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { MaxLength, ValidateNested } from 'class-validator';
import { Field } from '@nestjs/graphql';

import {
  Property,
  Definition,
  Embedded,
  Thunk,
  OutputType,
  CreateInputType,
  UpdateInputType,
  Filterable,
  Sortable,
  allOperators,
} from '../../lib';

@Definition()
export class Book {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Thunk(MaxLength(100), { scopes: 'input' })
  @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
  @Thunk(Field(() => graphql.GraphQLString))
  @Filterable(() => graphql.GraphQLString, { operators: allOperators })
  @Sortable()
  name: string;
}

@Definition({ allowedApis: '*' })
export class Author {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  @Filterable(() => graphql.GraphQLString, { operators: allOperators })
  @Sortable()
  name: string;

  @Prop({ type: [SchemaFactory.createForClass(Book)] })
  @Thunk(Field(() => [OutputType(Book)]), { scopes: 'output' })
  @Thunk(Field(() => [CreateInputType(Book)], { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => [UpdateInputType(Book)], { nullable: true }), { scopes: 'update' })
  @Thunk(Type(() => CreateInputType(Book)), { scopes: 'create' })
  @Thunk(Type(() => UpdateInputType(Book)), { scopes: 'update' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'create' })
  @Thunk(ValidateNested({ each: true }), { scopes: 'update' })
  @Embedded(() => Book, { allowApis: ['create', 'update', 'remove', 'getOne', 'getAll'] })
  books: Book[];
}
