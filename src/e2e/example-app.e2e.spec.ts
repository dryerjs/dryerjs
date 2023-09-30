import { getIntrospectionQuery } from 'graphql';
import * as request from 'supertest';
import { User, dryerConfig as exampleDryerConfig } from '../example/app';
import { Dryer } from '../dryer';

export const dryer = Dryer.init({
    ...exampleDryerConfig,
    beforeApplicationInit: undefined,
    afterApplicationInit: undefined,
    mongoUri: process.env.E2E_MONGO_URI || 'mongodb://127.0.0.1:27017/dryer-e2e?directConnection=true',
    port: 0,
});

const makeGraphqlRequest = async (input: { query: string; variables?: object }) => {
    return request(dryer.expressApp).post('/').send(input);
};

describe('Example app', () => {
    beforeAll(async () => {
        await dryer.start();
        await dryer.model(User).db.deleteMany({});
    });

    it('Generate correct graphql schema', async () => {
        const query = getIntrospectionQuery();
        const response = await dryer.apolloServer.executeOperation({
            query,
        });
        const ignoreTypeNames = [
            'String',
            'Int',
            'Boolean',
            '__Schema',
            '__Type',
            '__TypeKind',
            '__Field',
            '__InputValue',
            '__EnumValue',
            '__Directive',
            '__DirectiveLocation',
        ];
        const types = response.body['singleResult'].data.__schema.types.filter(({ name }) => {
            return !ignoreTypeNames.includes(name);
        });
        expect(types).toMatchSnapshot();
    });

    describe('User CRUD works', () => {
        beforeAll(async () => {
            const userInputs = [
                {
                    email: 'foo@example1.com',
                    password: 'Example@1',
                    requestId: 'test-request-id-1',
                    yearOfBirth: 2001,
                },
                {
                    email: 'bar@example2.com',
                    password: 'Example@2',
                    requestId: 'test-request-id-2',
                    yearOfBirth: 2002,
                },
                {
                    email: 'baz@example3.com',
                    password: 'Example@3',
                },
            ];

            for (const userInput of userInputs) {
                await makeGraphqlRequest({
                    query: `
                        mutation CreateUser($input: CreateUserInput!) {
                            createUser(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: { input: userInput },
                });
            }
        });

        it('Happy path works', async () => {
            const allUsersResponse = await makeGraphqlRequest({
                query: `
                    query Users {
                        users {
                            id
                            email
                            yearOfBirth
                            createdAt
                            updatedAt
                        }
                    }
                `,
            });

            const comparableUsers = allUsersResponse.body.data.users.map(({ email, yearOfBirth }) => ({
                email,
                yearOfBirth,
            }));
            expect(comparableUsers).toMatchSnapshot();

            // get user by id
            const firstUserId = allUsersResponse.body.data.users[0].id;
            const firstUserResponse = await makeGraphqlRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            id
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });
            expect(firstUserResponse.body.data.user.id).toEqual(firstUserId);

            // update user by id
            const newYearOfBirthForUser1 = 1999;
            await makeGraphqlRequest({
                query: `
                    mutation UpdateUser($input: UpdateUserInput!, $userId: String!) {
                        updateUser(id: $userId, input: $input) {
                            id
                        }
                    }
                `,
                variables: {
                    input: { yearOfBirth: newYearOfBirthForUser1 },
                    userId: firstUserId,
                },
            });

            const firstUserResponseAfterUpdated = await makeGraphqlRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            yearOfBirth
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });
            expect(firstUserResponseAfterUpdated.body.data.user.yearOfBirth).toEqual(newYearOfBirthForUser1);

            // delete user
            await makeGraphqlRequest({
                query: `
                    mutation DeleteUser($userId: String!) {
                        deleteUser(id: $userId) {
                            id
                            deleted
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });

            const firstUserResponseAfterDeleted = await makeGraphqlRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            yearOfBirth
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });
            expect(firstUserResponseAfterDeleted.body.data).toEqual(null);
            expect(firstUserResponseAfterDeleted.body.errors[0].message).toContain('No User found with id');
        });
    });

    afterAll(async () => {
        await dryer.model(User).db.deleteMany({});
        await dryer.stop();
    });
});
