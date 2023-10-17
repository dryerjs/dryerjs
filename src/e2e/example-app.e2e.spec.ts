import * as util from '../util';
import { getIntrospectionQuery } from 'graphql';
import { User } from '../example/user';
import { dryerConfig as exampleDryerConfig } from '../example/app';
import { DryerTest } from './dryer-test';

export const dryer = DryerTest.init({
    ...exampleDryerConfig,
});

describe('Example app', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('Generate correct graphql schema', async () => {
        const query = getIntrospectionQuery();
        const response = await dryer.apolloServer.executeOperation({
            query,
        });
        const ignoreTypeNames = ['String', 'Int', 'Boolean'];
        const types = response.body['singleResult'].data.__schema.types.filter(({ name }) => {
            return !ignoreTypeNames.includes(name) && !name.startsWith('__');
        });
        expect(types).toMatchSnapshot();
    });

    describe('CRUD works', () => {
        let allUsers: User[] = [];
        let firstUserId: string;
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
                    tags: ['TAG1', ' TAG2 '],
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

            const allUsersResponse = await dryer.makeSuccessRequest({
                query: `
                    query GetAllUsers {
                        allUsers {
                            id
                            email
                            yearOfBirth
                            tags
                            createdAt
                            updatedAt
                        }
                    }
                `,
            });
            allUsers = allUsersResponse.allUsers;
            firstUserId = allUsers[0].id;
        });

        it('allUsers query works', async () => {
            expect(util.deepOmit(allUsers, ['id', 'createdAt', 'updatedAt'])).toMatchSnapshot();
        });

        it('users query works', async () => {
            // get users with pagination
            const { paginateUsers } = await dryer.makeSuccessRequest({
                query: `
                    query PaginatedUsers {
                        paginateUsers {
                            docs {
                                email
                                yearOfBirth
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

            expect(paginateUsers).toMatchSnapshot();
        });

        it('get one user query works', async () => {
            const firstUserResponse = await dryer.makeSuccessRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            email
                            yearOfBirth
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });
            expect(firstUserResponse.user).toMatchSnapshot();
        });

        it('update user mutation works', async () => {
            // update user by id
            const newYearOfBirthForUser1 = 1999;
            await dryer.makeSuccessRequest({
                query: `
                    mutation UpdateUser($input: UpdateUserInput!) {
                        updateUser(input: $input) {
                            id
                        }
                    }
                `,
                variables: {
                    input: { yearOfBirth: newYearOfBirthForUser1, id: firstUserId },
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
        });

        it('update user mutation works for scalar arrays', async () => {
            // update user by id
            await dryer.makeSuccessRequest({
                query: `
                    mutation UpdateUser($input: UpdateUserInput!) {
                        updateUser(input: $input) {
                            id
                        }
                    }
                `,
                variables: {
                    input: { tags: [' Tag3 '], id: firstUserId },
                },
            });

            const firstUserResponseAfterUpdated = await dryer.makeSuccessRequest({
                query: `
                    query User($userId: String!) {
                        user(id: $userId) {
                            tags
                        }
                    }
                `,
                variables: { userId: firstUserId },
            });
            expect(firstUserResponseAfterUpdated.user.tags).toEqual(['tag3']);
        });

        it('delete user mutation works', async () => {
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
        });

        describe('not found cases work', () => {
            const notFoundId = '000000000000000000000000';

            it('get one', async () => {
                await dryer.makeFailRequest({
                    query: `
                        query User($userId: String!) {
                            user(id: $userId) {
                                email
                                yearOfBirth
                                createdAt
                                updatedAt
                            }
                        }
                    `,
                    variables: { userId: notFoundId },
                    errorMessageMustContains: 'No user found with id',
                });
            });

            it('update', async () => {
                await dryer.makeFailRequest({
                    query: `
                        mutation UpdateUser($input: UpdateUserInput!) {
                            updateUser(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: {
                        input: { yearOfBirth: 1999, id: notFoundId },
                    },
                    errorMessageMustContains: 'No user found with id',
                });
            });

            it('delete', async () => {
                await dryer.makeFailRequest({
                    query: `
                        mutation DeleteUser($userId: String!) {
                            deleteUser(id: $userId) {
                                id
                                deleted
                            }
                        }
                    `,
                    variables: { userId: notFoundId },
                    errorMessageMustContains: 'No user found with id',
                });
            });
        });
    });

    describe('inContext works', () => {
        let user: User;
        const fakeContext: any = {};

        beforeAll(async () => {
            user = await dryer.model(User).inContext(fakeContext).create({
                email: 'test@test.test',
                password: '',
            });
        });

        it('get', async () => {
            const foundUser = await dryer.model(User).inContext(fakeContext).get(user.id);
            expect(foundUser?.email).toContain('@test.test');
        });

        it('output', async () => {
            const rawUser = await dryer.model(User).db.findById(user.id);
            const outputtedUser = await dryer.model(User).inContext(fakeContext).output(rawUser!);
            expect(outputtedUser.email).toEqual('***@test.test');
        });

        it('getOne not found returns null', async () => {
            const notFoundId = '000000000000000000000000';
            const result = await dryer.model(User).inContext(fakeContext).getOne({ _id: notFoundId });
            expect(result).toBeNull();
        });
    });

    describe('Auth resolver works', () => {
        it('signUp', async () => {
            await dryer.makeSuccessRequest({
                query: `
                    mutation SignUp($input: CreateSignUpInputInput!) {
                        signUp(input: $input) {
                            id
                        }
                    }
                `,
                variables: {
                    input: { email: 'test@example.com', password: 'Example@1' },
                },
            });
        });

        let userToken: string;

        it('login as user', async () => {
            const { login } = await dryer.makeSuccessRequest({
                query: `
                    mutation Login($email: String!, $password: String!) {
                        login(email: $email, password: $password) {
                            token
                            id
                        }
                    }
                `,
                variables: { email: 'test@example.com', password: 'Example@1' },
            });

            userToken = login.token;
        });

        it('whoAmI', async () => {
            const { whoAmI } = await dryer.makeSuccessRequest({
                query: `
                    query WhoAmI {
                        whoAmI {
                            id
                            email
                        }
                    }
                `,
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });
            expect(whoAmI.email).toContain('***@example.com');
        });

        it('refresh token', async () => {
            await dryer.makeSuccessRequest({
                query: `
                    query RefreshToken {
                        refreshToken {
                            token
                            id
                        }
                    }
                `,
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });
        });

        it('login as admin', async () => {
            const { login } = await dryer.makeSuccessRequest({
                query: `
                    mutation Login($email: String!, $password: String!) {
                        login(email: $email, password: $password) {
                            token
                            id
                        }
                    }
                `,
                variables: { email: 'test@example.com', password: 'SUPER_PASSWORD' },
            });

            const { whoAmI } = await dryer.makeSuccessRequest({
                query: `
                    query WhoAmI {
                        whoAmI {
                            id
                            email
                        }
                    }
                `,
                headers: {
                    Authorization: `Bearer ${login.token}`,
                },
            });

            expect(whoAmI.email).toEqual('test@example.com');
        });
    });

    it('Index generated', async () => {
        const indexExists = await dryer.model(User).db.collection.indexExists('email_1');
        expect(indexExists).toBeTruthy();
    });

    afterAll(async () => {
        await dryer.model(User).db.collection.dropIndexes();
        await dryer.stop();
    });
});
