import { getIntrospectionQuery } from 'graphql';
import { User, dryerConfig as exampleDryerConfig } from '../example/app';
import { DryerTest } from './utils';

export const dryer = DryerTest.init({
    ...exampleDryerConfig,
});

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
                await dryer.makeSuccessRequest({
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
            const allUsersResponse = await dryer.makeSuccessRequest({
                query: `
                    query GetAllUsers {
                        allUsers {
                            id
                            email
                            yearOfBirth
                            createdAt
                            updatedAt
                        }
                    }
                `,
            });

            const comparableUsers = allUsersResponse.allUsers.map(({ email, yearOfBirth }) => ({
                email,
                yearOfBirth,
            }));
            expect(comparableUsers).toMatchSnapshot();

            // get users with pagination
            const paginatedUsers = await dryer.makeSuccessRequest({
                query: `
                    query Users {
                        users {
                            docs {
                                id
                                email
                                yearOfBirth
                                createdAt
                                updatedAt
                            }
                            totalDocs
                            limit
                            page
                            totalPages
                            hasPrevPage
                            hasNextPage
                        }
                    }
                `,
            });

            expect({
                ...paginatedUsers.users,
                docs: paginatedUsers.users.docs.map(({ email, yearOfBirth }) => ({
                    email,
                    yearOfBirth,
                })),
            }).toMatchSnapshot();

            // get user by id
            const firstUserId = allUsersResponse.allUsers[0].id;
            const firstUserResponse = await dryer.makeSuccessRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            id
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });
            expect(firstUserResponse.user.id).toEqual(firstUserId);

            // update user by id
            const newYearOfBirthForUser1 = 1999;
            await dryer.makeSuccessRequest({
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

            const firstUserResponseAfterUpdated = await dryer.makeSuccessRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            yearOfBirth
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });
            expect(firstUserResponseAfterUpdated.user.yearOfBirth).toEqual(newYearOfBirthForUser1);

            // delete user
            await dryer.makeSuccessRequest({
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

            await dryer.makeFailRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            yearOfBirth
                        }
                    }
                `,
                variables: { userId: firstUserId },
                errorMessageMustContains: 'No User found with id',
            });
        });
    });

    afterAll(async () => {
        await dryer.model(User).db.deleteMany({});
        await dryer.stop();
    });
});
