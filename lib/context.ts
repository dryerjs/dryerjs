import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const defaultContextDecorator = createParamDecorator((_data: unknown, ctx: ExecutionContext) =>
  GqlExecutionContext.create(ctx).getContext(),
);

export type ContextDecorator = typeof defaultContextDecorator;
