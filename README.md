<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://dryerjs.github.io/logo-light.png">
  <source media="(prefers-color-scheme: dark)" srcset="https://dryerjs.github.io/logo-dark.png">
  <img alt="DryerJS Logo" src="https://dryerjs.github.io/logo-light.png" width="300px">
</picture>

DryerJS, built on NestJS with Mongoose, is a robust tool for creating CRUD GraphQL APIs. It allows for declarative model declaration,
supports model relations, and is easily customizable, thus enhancing API development and minimizing repetitive coding.

[![codecov](https://codecov.io/gh/dryerjs/dryerjs/graph/badge.svg?token=ZQOWFCGXUK)](https://codecov.io/gh/dryerjs/dryerjs)
[![Build Status](https://github.com/dryerjs/dryerjs/workflows/CI/badge.svg)](https://github.com/dryerjs/dryerjs/actions)
[![Release Status](https://github.com/dryerjs/dryerjs/workflows/Release/badge.svg)](https://github.com/dryerjs/dryerjs/actions)
[![npm](https://img.shields.io/npm/v/dryerjs?logo=npm&color=success)](https://www.npmjs.com/package/dryerjs)
[![Discord](https://img.shields.io/discord/1165841842873565264?logo=discord&color=success)](https://discord.gg/mBZN86W5Fa)
[![Paypal](https://img.shields.io/badge/Donate-PayPal-ff3f59.svg?logo=paypal&color=success)](https://paypal.me/briandryerjs)

## Documentation

Checkout the documentation at [dryerjs.com](https://dryerjs.com) for more information.

## Getting Started

To get started with DryerJS, follow these steps:

1. Prepare:

   ```bash
   # init new nest project
   npm i -g @nestjs/cli && nest new my-project && cd my-project
   # install standard dependencies
   npm i @nestjs/graphql @nestjs/apollo @nestjs/mongoose
   # install peer dependencies
   npm i dataloader class-transformer class-validator
   # remove unrelated files
   npm run env -- rimraf src/app.(service|controller)*
   ```
2. Install DryerJS:

   ```bash
   npm i dryerjs
   ```

3. Declare your first model on `src/user.ts`:

   ```typescript
   import { Definition, Property, Id, Skip } from 'dryerjs';

   @Definition()
   export class User {
     @Id()
     id: string;

     @Property()
     email: string;

     @Property({ update: Skip, output: Skip })
     password: string;

     @Property()
     name: string;
   }
   ```

4. Import your model and DryerJSModule in AppModule with other modules inside app.module.ts:

   ```typescript
   import { Module } from '@nestjs/common';
   import { GraphQLModule } from '@nestjs/graphql';
   import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
   import { MongooseModule } from '@nestjs/mongoose';
   import { DryerModule } from 'dryerjs';

   import { User } from './user';

   @Module({
     imports: [
       GraphQLModule.forRoot<ApolloDriverConfig>({
         driver: ApolloDriver,
         autoSchemaFile: true,
         playground: true,
       }),
       MongooseModule.forRoot('mongodb://127.0.0.1:27017/test'),
       DryerModule.register({ definitions: [User] }),
     ],
   })
   export class AppModule {}
   ```

5. Start server

   ```bash
   npm run start:dev
   ```

6. Open browser and go to [http://localhost:3000/graphql](http://localhost:3000/graphql) to see the GraphQL playground.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/dryerjs/dryerjs/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE file](https://github.com/dryerjs/dryerjs/blob/master/LICENSE) for details.
