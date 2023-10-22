<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://dryerjs.github.io/logo-light.png">
  <source media="(prefers-color-scheme: dark)" srcset="https://dryerjs.github.io/logo-dark.png">
  <img alt="DryerJS Logo" src="https://dryerjs.github.io/logo-light.png" width="300px">
</picture>

DryerJS is a powerful library that allows you to generate CRUD GraphQL APIs in a declarative way, seamlessly integrating with Apollo Server, Mongoose, and MongoDB. With DryerJS, you can streamline the development of your GraphQL APIs and focus on your application's logic instead of writing repetitive boilerplate code.

[![codecov](https://codecov.io/gh/dryerjs/dryerjs/graph/badge.svg?token=ZQOWFCGXUK)](https://codecov.io/gh/dryerjs/dryerjs)
[![Build Status](https://github.com/dryerjs/dryerjs/workflows/CI/badge.svg)](https://github.com/dryerjs/dryerjs/actions)
[![Release Status](https://github.com/dryerjs/dryerjs/workflows/Release/badge.svg)](https://github.com/dryerjs/dryerjs/actions)
[![npm version](https://badge.fury.io/js/dryerjs.svg)](https://badge.fury.io/js/dryerjs)

## Features

- Declarative schema definition for GraphQL APIs.
- Integration with Apollo Server for GraphQL endpoint setup.
- Seamless interaction with MongoDB and Mongoose.
- Fine-grained control over input/output data transformation.
- Support for input validation and data manipulation.
- Easily customizable to fit your specific needs.

## Getting Started

To get started with DryerJS, follow these steps:

1. Init NestJS project:

   ```bash
   npm i -g @nestjs/cli && nest new my-project
   ```

2. Install dependencies:

   ```bash
   npm i @nestjs/graphql @nestjs/apollo @apollo/server graphql class-transformer class-validator @nestjs/mongoose
   ```

3. Install DryerJS as a dependency in your project

   ```bash
   npm install dryerjs
   ```

4. Declare your first model on `src/user.ts`:

   ```typescript
   import { Entity, Property } from 'dryerjs';

   @Entity()
   export class User {
     @Property()
     id: string;

     @Property()
     email: string;

     @Property()
     password: string;

     @Property()
     name: string;
   }
   ```

5. Import your model and DryerJSModule in AppModule with other modules inside app.module.ts:

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

6. Start server

   ```bash
   npm run start:dev
   ```

7. Open browser and go to [http://localhost:3000/graphql](http://localhost:3000/graphql) to see the GraphQL playground.

8. Modify your model and see the changes in the GraphQL playground. Using Validate, Transform, Default, Enum, Embedded features to customize your model. Take a look at more complicated [example models](https://github.com/dryerjs/dryerjs/tree/master/src).

## Documentation

We are actively working on documentation. In the meantime, you can explore our [example project](https://github.com/dryerjs/dryerjs/tree/master/src) to see DryerJS in action.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/dryerjs/dryerjs/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE file](https://github.com/dryerjs/dryerjs/blob/master/LICENSE) for details.
