import { TestServer } from './test-server';
import { Id, Property } from '../lib/property';
import { Definition } from '../lib/definition';
import { Thunk } from '../lib/thunk';
import { MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

@Definition()
export class UserTest {
    @Id()
    id: string;

    @Thunk(MaxLength(100), { scopes: 'input' })
    @Thunk(Transform(({ value }) => value.trim()), { scopes: 'input' })
    @Property()
    name: string;
}

const server = TestServer.init({
  definitions: [UserTest],
});

describe('Update id type string should throw error', () => {
  beforeAll(async () => {
    await server.start();
  });

  let userTest: UserTest;
  it('Update id should throw error', async () => {
    const response = await server.makeSuccessRequest({
      query: `
        mutation CreateUserTest($input: CreateUserTestInput!) {
          createUserTest(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          name: 'User 1',
        },
      }
    });
    userTest = response.createUserTest;
    console.log(userTest.id);
    
    await server.makeFailRequest({
      query: `
        mutation UpdateUserTest($input: UpdateUserTestInput!) {
          updateUserTest(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          id: userTest.id,
          name: 'User 2',
        },
      },
      errorMessageMustContains: 'Id must be ObjectId',
    });
  });

  afterAll(async () => {
    await server.stop();
  });
});
