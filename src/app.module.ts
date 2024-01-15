import { Module, UseGuards } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { MongooseModule } from '@nestjs/mongoose';

import { Definition, DryerModule } from 'dryerjs';
import { AuthResolver } from './resolvers';
import {
  Product,
  Tag,
  User,
  Author,
  Image,
  Customer,
  Variant,
  Computer,
  Color,
  Comment,
  Store,
  Specification,
  Rating,
  Shop,
  Promotion,
  Order,
  Item,
} from './models';
import { Ctx } from './ctx';
import { AdminGuard, UserGuard } from './models/fake-guards';

const definitions: Definition[] = [
  Store,
  Product,
  Tag,
  User,
  Author,
  Image,
  Variant,
  Customer,
  Computer,
  Color,
  Comment,
  Specification,
  Rating,
  Shop,
  Promotion,
  Order,
  Item,
];

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
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/dryer-debug'),
    DryerModule.register({
      definitions,
      contextDecorator: Ctx,
      resolverConfigs: [
        {
          definition: User,
          allowedApis: '*',
          decorators: {
            default: [UseGuards(UserGuard)],
            list: [UseGuards(AdminGuard)],
            write: [UseGuards(AdminGuard)],
            update: [UseGuards(UserGuard)],
          },
        },
      ],
    }),
  ],
  providers: [AuthResolver],
})
export class AppModule {}
