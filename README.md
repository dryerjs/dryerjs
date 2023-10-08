# DryerJS

[![codecov](https://codecov.io/gh/vanpho93/dryerjs/graph/badge.svg?token=ZQOWFCGXUK)](https://codecov.io/gh/vanpho93/dryerjs)
[![Build Status]( https://github.com/vanpho93/dryerjs/workflows/CI/badge.svg)](https://github.com/vanpho93/dryerjs/actions)
[![Release Status]( https://github.com/vanpho93/dryerjs/workflows/Release/badge.svg)](https://github.com/vanpho93/dryerjs/actions)
[![npm version](https://badge.fury.io/js/dryerjs.svg)](https://badge.fury.io/js/dryerjs)

DryerJS is a powerful library that allows you to generate CRUD GraphQL APIs in a declarative way, seamlessly integrating with Apollo Server, Mongoose, and MongoDB. With DryerJS, you can streamline the development of your GraphQL APIs and focus on your application's logic instead of writing repetitive boilerplate code.

## Features

- Declarative schema definition for GraphQL APIs.
- Integration with Apollo Server for GraphQL endpoint setup.
- Seamless interaction with MongoDB and Mongoose.
- Fine-grained control over input/output data transformation.
- Support for input validation and data manipulation.
- Easily customizable to fit your specific needs.

## Getting Started

To get started with DryerJS, follow these steps:

1. Init working directory with typescript:

   ```bash
    mkdir my-project &&
    cd my-project &&
    npm init -y &&
    npm install typescript ts-node --save-dev &&
    echo '{
        "compilerOptions": {
            "emitDecoratorMetadata": true,
            "experimentalDecorators": true,
            "module": "CommonJS",
            "target": "ES2021"
        }
    }' >> tsconfig.json &&
    touch main.ts
   ```

3. Install DryerJS as a dependency in your project

   ```bash
   npm install dryerjs
   ```

3. Declare a model and init DryerJS in `main.ts`:
    ```typescript
    import { Dryer, Property } from 'dryerjs';

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

    Dryer.init({
        modelDefinitions: [User],
        mongoUri: 'mongodb://127.0.0.1:27017/test',
        port: 3000,
    }).start();
    ```

4. Start server
    ```bash
    npm run env -- ts-node main.ts
    ```

5. Open browser and go to [http://localhost:3000](http://localhost:3000) to see the GraphQL playground.

6. Modify your model and see the changes in the GraphQL playground. Using Validate, Transform, Default, Enum, Embedded features to customize your model. Take a look at more complicated [example models](https://github.com/vanpho93/dryerjs/tree/master/src/example/app.ts).

## Documentation

We are actively working on documentation. In the meantime, you can explore our [example project](https://github.com/vanpho93/dryerjs/tree/master/src/example) to see DryerJS in action.

## Contributing

We welcome contributions to DryerJS! If you find a bug or have a feature request, please open an issue on our GitHub repository. If you'd like to contribute code, feel free to open a pull request.

## Development Guide

To contribute to the development of "DryerJS" or work on your own projects using this library, follow these steps:

### Set Up Your Environment

* Copy the .env.example file to a new .env file:

   ```bash
   cp .env.example .env
    ```

* Start the Example Application

   ```bash
   npm run start
   ```

* Visit [http://localhost:PORT](http://localhost:PORT) in your web browser, where PORT is the port number specified in your .env file. You should see the GraphQL Playground, allowing you to interact with the API.

### Unit testing

To run unit tests for DryerJS, use the following command:


   ```bash
    npm run test
   ```

### End-to-End Testing

To run end-to-end tests, use the following command:

   ```bash
   npm run test:e2e
   ```

### Updating Snapshots

To update snapshots for end-to-end tests, use the following command:

   ```bash
   npm run test:e2e -- --updateSnapshot
   ```

## License

This project is licensed under the MIT License - see the [LICENSE file](https://github.com/vanpho93/dryerjs/blob/master/LICENSE) for details.
