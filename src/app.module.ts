import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';

import { Definition, DryerModule } from '../lib';
import { AuthResolver } from './resolvers';
import { Product, Tag, User, Author } from './models';

const definitions: Definition[] = [Author, User, Product, Tag];

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
    MongooseModule.forFeature(
      definitions.map((definition) => ({
        name: definition.name,
        schema: SchemaFactory.createForClass(definition),
      })),
    ),
  ],
  providers: [AuthResolver],
})
export class AppModule {}
