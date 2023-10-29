import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { MongooseModule } from '@nestjs/mongoose';

import { Definition, DryerModule } from '../lib';
import { AuthResolver } from './resolvers';
import { Product, Tag, User, Author, Variant, Image } from './models';

const definitions: Definition[] = [Product, Tag, User, Author, Variant, Image];

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
    DryerModule.register({ definitions }),
  ],
  providers: [AuthResolver],
})
export class AppModule {}
