import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { MongooseModule } from '@nestjs/mongoose';

import { Definition, DryerModule } from '../lib';
import { AuthResolver } from './resolvers';
import { Product, Tag, User, Author, UserHook, Image, Customer, Variant, Computer, Color } from './models';
import { Ctx } from './ctx';

const definitions: Definition[] = [Product, Tag, User, Author, Image, Variant, Customer, Computer, Color];

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      installSubscriptionHandlers: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/dryer-debug'),
    DryerModule.register({
      definitions,
      contextDecorator: Ctx,
      hooks: [UserHook],
    }),
  ],
  providers: [AuthResolver],
})
export class AppModule {}
