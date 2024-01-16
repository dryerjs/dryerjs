import { Module, UseGuards } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { MongooseModule } from '@nestjs/mongoose';

import { DryerModule } from 'dryerjs';
import { AuthResolver } from './resolvers';
import {
  Product,
  Tag,
  User,
  Author,
  Image,
  Variant,
  Computer,
  Color,
  Comment,
  Store,
  Customer,
  Specification,
  Shop,
  Promotion,
  Rating,
  Order,
  Item,
} from './models';
import { Ctx } from './ctx';
import { AdminGuard, UserGuard } from './models/fake-guards';

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
      definitions: [
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
        {
          definition: Color,
          allowedApis: '*',
        },

        {
          definition: Tag,
          allowedApis: '*',
        },
        {
          definition: Image,
          allowedApis: '*',
        },
        {
          definition: Comment,
          allowedApis: '*',
        },
        {
          definition: Store,
          allowedApis: '*',
        },
        {
          definition: Variant,
          allowedApis: '*',
        },
        {
          definition: Product,
          allowedApis: '*',
        },
        {
          definition: Author,
          allowedApis: '*',
          embeddedConfigs: [
            {
              allowedApis: [],
              property: 'events',
            },
            {
              allowedApis: ['create', 'update', 'remove', 'findOne', 'findAll'],
              property: 'books',
            },
          ],
        },
        {
          definition: Rating,
          allowedApis: '*',
        },
        {
          definition: Order,
          allowedApis: '*',
        },
        {
          definition: Item,
          allowedApis: '*',
        },
        {
          definition: Computer,
          allowedApis: '*',
        },
        Customer,
        Specification,
        Shop,
        Promotion,
      ],
      contextDecorator: Ctx,
    }),
  ],
  providers: [AuthResolver],
})
export class AppModule {}
