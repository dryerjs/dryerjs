import { NestFactory } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AppModule } from './app.module';

@Injectable()
export class HeaderGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const SECRET_API_KEY = process.env.SECRET_API_KEY;
    if (!SECRET_API_KEY) return true;
    const req = GqlExecutionContext.create(context).getContext().req;
    return req.header('x-dryerjs-api-key') === SECRET_API_KEY;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new HeaderGuard());
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
