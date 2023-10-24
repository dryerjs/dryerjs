import { TestServer } from './test-server';
import { User } from '../src/models';

const server = TestServer.init({
  definitions: [User],
});

describe('SignUp Works', () => {
  beforeAll(async () => {
    await server.start();
  });

  it('should create a user and then query whoAmI', async () => {
    const createUserResponse = await server.makeSuccessRequest({
      query: `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          email
          name
          password
        }
      }
      `,
      variables: {
        "input": {
          "email": "dryerjs_123@dryerjs.io",
          "name": "dryerjs_123",
          "password": "dryerjs_123"
        }
      },
    });

    expect(createUserResponse.createUser).toEqual({
      email: 'dryerjs_123@dryerjs.io',
      name: 'dryerjs_123',
      password: `dryerjs_123`
    });

    // const userId = createUserResponse.createUser.id;

    // const whoAmIResponse = await server.makeSuccessRequest({
    //   query: `
    //   query WhoAmI($userId: String!) {
    //     whoAmI(userId: $userId) {
    //       email
    //       name
    //       password
    //     }
    //   }
    //   `,
    //   variables: {
    //     "input": {
    //       "userId": userId
    //     }
    //   },
    // });

    // expect(whoAmIResponse.whoAmI).toBeTruthy();


  });

  afterAll(async () => {
    await server.stop();
  });
});
