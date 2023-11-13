import * as graphql from 'graphql';
import { IsEmail, MinLength } from 'class-validator';
import { CanActivate, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { Definition, Thunk, Filterable, ObjectId, Property, Skip, Id } from '../../lib';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return GqlExecutionContext.create(context).getContext().req.header('fake-role') === 'admin';
  }
}

@Injectable()
export class UserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = GqlExecutionContext.create(context).getContext().req.header('fake-role');
    return role === 'admin' || role === 'user';
  }
}

@Definition({
  allowedApis: '*',
  resolverDecorators: {
    default: [UseGuards(UserGuard)],
    list: [UseGuards(AdminGuard)],
    write: [UseGuards(AdminGuard)],
    update: [UseGuards(UserGuard)],
  },
})
export class User {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Thunk(IsEmail(), { scopes: ['input'] })
  @Filterable(() => graphql.GraphQLString, { operators: ['eq', 'in'] })
  @Property({ db: { unique: true } })
  email: string;

  @Thunk(MinLength(5), { scopes: ['create'] })
  @Property({ output: Skip, update: Skip })
  password: string;
}
