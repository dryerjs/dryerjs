import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import * as util from '../lib/util';

export const Ctx = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const rawContext = GqlExecutionContext.create(ctx).getContext();
  const fakeContextInString = rawContext.req.header('fake-context');
  const fakeContext = util.isNil(fakeContextInString) ? null : JSON.parse(fakeContextInString);
  return fakeContext;
});
