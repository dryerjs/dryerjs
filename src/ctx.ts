import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const Ctx = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const rawContext = GqlExecutionContext.create(ctx).getContext();
  try {
    return JSON.parse(rawContext.req.header('fake-context'));
  } catch (error) {
    return null;
  }
});
