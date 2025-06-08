import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return GqlExecutionContext.create(context).getContext().req.header('fake-role') === 'admin';
  }
}

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const role = GqlExecutionContext.create(context).getContext().req.header('fake-role') as string;
    return role === 'admin' || role === 'user';
  }
}
