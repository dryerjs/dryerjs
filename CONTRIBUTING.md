
## Contributing

We welcome contributions to DryerJS! If you find a bug or have a feature request, please open an issue on our GitHub repository. If you'd like to contribute code, feel free to open a pull request.

## Development Guide

To contribute to the development of "DryerJS" or work on your own projects using this library, follow these steps:

### Set Up Your Environment

* Start mongodb with docker-compose if needed:

   ```bash
   docker-compose up -d
   ```

* Start the Example Application

   ```bash
   npm run start:dev
   ```

* Visit [http://localhost:3000/graphql](http://localhost:3000/graphql) in your web browser. You should see the GraphQL Playground, allowing you to interact with the API.

### Unit testing

To run unit tests for DryerJS, use the following command:


   ```bash
    npm run test:unit
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

### Test coverage

To check test coverage, use the following command:

   ```bash
   npm run test:cov && npm run show-cov
   ```

### Create PRs

Follow [this instruction](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)
