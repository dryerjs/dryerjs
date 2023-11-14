import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
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
