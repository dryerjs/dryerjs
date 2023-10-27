import { TestServer } from './test-server';
import { User } from '../src/models';
import { AuthResolver } from '../src/resolvers';

const server = TestServer.init({
  definitions: [User],
  providers: [AuthResolver],
});

describe('Auth Resolver works', () => {
    let user;

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
          id
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
      id: expect.any(String),
    });
    user = signUpResponse.signUp;
  });

  it('whoIamI works', async () => {
    const whoAmIResponse = await server.makeSuccessRequest({
      query: `
        query WhoAmI($userId: String!) {
          whoAmI(userId: $userId) {
            email
            name
          }
        }
      `,
      variables: {
        userId: user.id,
      },
    });

    expect(whoAmIResponse.whoAmI).toEqual({
      email: 'dryerjs_123@dryerjs.io',
      name: 'dryerjs_123',
    });
  });

  it('invalid email throw error', async () => {
    await server.makeFailRequest({
      query: `
      mutation SignUp($input: CreateUserInput!) {
        signUp(input: $input) {
          email
          name
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
