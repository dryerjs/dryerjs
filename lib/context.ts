import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const Ctx = createParamDecorator((_data: unknown, ctx: ExecutionContext) =>
  GqlExecutionContext.create(ctx).getContext(),
);
