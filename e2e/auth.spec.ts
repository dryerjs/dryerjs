import { TestServer } from './test-server';
import { User } from '../src/models';
import { AuthResolver } from '../src/resolvers';

const server = TestServer.init({
  definitions: [User],
  providers: [AuthResolver],
});

describe('Auth Resolver works', () => {
  let userId;

  beforeAll(async () => {
    await server.start();
  });

  it('signUp works', async () => {
    const signUpResponse = await server.makeSuccessRequest({
      query: `
      mutation SignUp($input: CreateUserInput!) {
        signUp(input: $input) {
          email
          name
          password
        }
      }
      `,
      variables: {
        input: {
          email: 'dryerjs_123@dryerjs.io',
          name: 'dryerjs_123',
          password: 'dryerjs_123',
        },
      },
    });

    expect(signUpResponse.signUp).toEqual({
      email: 'dryerjs_123@dryerjs.io',
      name: 'dryerjs_123',
      password: `dryerjs_123`,
    });
  });

  it('whoIamI works', async () => {
    await server.makeSuccessRequest({
      query: `
      mutation SignUp($input: CreateUserInput!) {
        signUp(input: $input) {
          email
          name
          password
        }
      }
      `,
      variables: {
        input: {
          email: 'dryerjs_123@dryerjs.io',
          name: 'dryerjs_123',
          password: 'dryerjs_123',
        },
      },
    });

    const getAllUsersResponse = await server.makeSuccessRequest({
      query: `
        query AllUsers {
          allUsers {
            email
            id
            name
            password
          }
        }
      `,
      variables: {},
    });

    userId = getAllUsersResponse.allUsers[0].id;

    const whoAmIResponse = await server.makeSuccessRequest({
      query: `
        query WhoAmI($userId: String!) {
          whoAmI(userId: $userId) {
            email
            name
            password
          }
        }
      `,
      variables: {
        userId: userId,
      },
    });

    expect(whoAmIResponse.whoAmI).toBeTruthy();
  });

  it('invalid email throw error', async () => {
    await server.makeFailRequest({
      query: `
      mutation SignUp($input: CreateUserInput!) {
        signUp(input: $input) {
          email
          name
          password
        }
      }
      `,
      variables: {
        input: {
          email: 'dryerjs_123@dryerjs',
          name: 'dryerjs_123',
          password: 'dryerjs_123',
        },
      },
      errorMessageMustContains: 'Bad Request Exception',
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
