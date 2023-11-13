import { TestServer } from './test-server';
import { User } from '../src/models';
import { AuthResolver } from '../src/resolvers';
import { Ctx } from '../src/ctx';

const server = TestServer.init({
  definitions: [User],
  providers: [AuthResolver],
  contextDecorator: Ctx,
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
        query WhoAmI {
          whoAmI {
            email
            name
          }
        }
      `,
      headers: {
        'fake-context': `{"userId":"${user.id}"}`,
      },
    });

    expect(whoAmIResponse.whoAmI).toEqual({
      email: 'dryerjs_123@dryerjs.io',
      name: 'dryerjs_123',
    });
  });

  it('resolverDecorators works', async () => {
    const allUsersQuery = `
      query {
        allUsers {
          id
        }
      }
    `;
    await server.makeSuccessRequest({
      query: allUsersQuery,
      headers: {
        'fake-role': 'admin',
      },
    });
    await server.makeFailRequest({
      query: allUsersQuery,
      headers: {
        'fake-role': 'user',
      },
      errorMessageMustContains: 'Forbidden',
    });
    await server.makeFailRequest({
      query: allUsersQuery,
      errorMessageMustContains: 'Forbidden',
    });
    await server.makeSuccessRequest({
      query: `query { user(id: "${user.id}") { email } }`,
      headers: {
        'fake-role': 'user',
      },
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
