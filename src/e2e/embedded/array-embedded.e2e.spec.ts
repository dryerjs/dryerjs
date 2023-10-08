import * as graphql from 'graphql';
import {
    DefaultOnInput,
    EmbeddedProperty,
    ExcludeOnCreate,
    NullableOnOutput,
    Property,
    RequiredOnCreate,
    TransformOnInput,
    Validate,
} from 'dryerjs';
import * as util from '../../util';
import { DryerTest } from '../dryer-test';

class Book {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @Property()
    @TransformOnInput((name: string) => name.trim())
    name: string;

    @Property()
    @NullableOnOutput()
    @Validate((publishedYear: number) => {
        if (publishedYear >= 0) return;
        throw new graphql.GraphQLError(`Invalid publishedYear ${publishedYear}`, {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 400 },
            },
        });
    })
    @DefaultOnInput(() => 0)
    publishedYear: number;
}

class Author {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @EmbeddedProperty({ type: Book })
    @NullableOnOutput()
    books: Book[];

    @Property()
    @RequiredOnCreate()
    name: string;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Author],
});

describe('Object embedded feature works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    describe('User CRUD works', () => {
        let allAuthors: Author[];

        beforeAll(async () => {
            const authorInputs = [
                {
                    name: 'Author 1',
                    books: [
                        {
                            name: 'Book 1',
                            publishedYear: 2000,
                        },
                        {
                            name: 'Book 2',
                        },
                    ],
                },
                {
                    name: 'Author 2',
                },
            ];

            for (const authorInput of authorInputs) {
                await dryer.makeSuccessRequest({
                    query: `
                        mutation CreateAuthor($input: CreateAuthorInput!) {
                            createAuthor(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: { input: authorInput },
                });
            }

            const allAuthorsResponse = await dryer.makeSuccessRequest({
                query: `
                    query Authors {
                        allAuthors {
                            id
                            name
                            books {
                                id
                                name
                                publishedYear
                            }
                        }
                    }
                `,
            });

            allAuthors = allAuthorsResponse.allAuthors;
        });

        it('should show authors with books', async () => {
            expect(util.deepOmit(allAuthors, ['id'])).toMatchSnapshot();
        });

        it('should be able to update books', async () => {
            const firstAuthor = allAuthors[0];
            const firstBook = firstAuthor.books[0];
            const firstUpdateResponse = await dryer.makeSuccessRequest({
                query: `
                    mutation UpdateAuthor($input: UpdateAuthorInput!) {
                        updateAuthor(input: $input) {
                            books {
                                id
                                name
                                publishedYear
                            }
                        }
                    }
                `,
                variables: {
                    input: {
                        id: firstAuthor.id,
                        books: [
                            {
                                ...firstBook,
                                publishedYear: 1999,
                            },
                        ],
                    },
                },
            });
            expect(firstUpdateResponse.updateAuthor.books[0]).toEqual({
                id: firstBook.id,
                name: 'Book 1',
                publishedYear: 1999,
            });
        });

        describe('embedded apis work', () => {
            let author: Author;

            beforeAll(async () => {
                const authorResponse = await dryer.makeSuccessRequest({
                    query: `
                        mutation CreateAuthor($input: CreateAuthorInput!) {
                            createAuthor(input: $input) {
                                id
                                name
                                books {
                                    id
                                    name
                                    publishedYear
                                }
                            }
                        }
                    `,
                    variables: {
                        input: {
                            name: 'Author 3',
                            books: [
                                {
                                    name: 'Book 1',
                                    publishedYear: 2000,
                                },
                                {
                                    name: 'Book 2',
                                },
                            ],
                        },
                    },
                });
                author = authorResponse.createAuthor;
            });

            it('getOne works', async () => {
                const { authorBook } = await dryer.makeSuccessRequest({
                    query: `
                        query AuthorBook($id: String!, $authorId: String!) {
                            authorBook(id: $id, authorId: $authorId) {
                                id
                                name
                                publishedYear
                            }
                        }
                    `,
                    variables: { authorId: author.id, id: author.books[0].id },
                });
                expect(authorBook).toEqual({
                    id: author.books[0].id,
                    name: 'Book 1',
                    publishedYear: 2000,
                });
            });

            it('create works', async () => {
                const response = await dryer.makeSuccessRequest({
                    query: `
                        mutation CreateAuthorBook($input: CreateBookInput!, $authorId: String!) {
                            createAuthorBook(input: $input, authorId: $authorId) {
                                id
                                name
                                publishedYear
                            }
                        }
                    `,
                    variables: {
                        input: {
                            name: 'Book 3',
                            publishedYear: 2003,
                        },
                        authorId: author.id,
                    },
                });
                expect(response.createAuthorBook).toEqual({
                    id: expect.any(String),
                    name: 'Book 3',
                    publishedYear: 2003,
                });
            });

            it('update works', async () => {
                const response = await dryer.makeSuccessRequest({
                    query: `
                        mutation UpdateAuthorBook($input: UpdateBookInput!, $authorId: String!) {
                            updateAuthorBook(input: $input, authorId: $authorId) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        input: {
                            name: 'Book 1 updated',
                            id: author.books[0].id,
                        },
                        authorId: author.id,
                    },
                });
                expect(response.updateAuthorBook).toEqual({
                    id: author.books[0].id,
                    name: 'Book 1 updated',
                });
            });

            it('delete works', async () => {
                const book2Id = author.books[1].id;
                const response = await dryer.makeSuccessRequest({
                    query: `
                        mutation DeleteAuthorBook($authorId: String!, $id: String!) {
                            deleteAuthorBook(authorId: $authorId, id: $id) {
                                id
                                deleted
                            }
                        }
                    `,
                    variables: {
                        authorId: author.id,
                        id: book2Id,
                    },
                });
                expect(response.deleteAuthorBook).toEqual({
                    id: book2Id,
                    deleted: true,
                });
            });

            it('get all works', async () => {
                const { allAuthorBooks } = await dryer.makeSuccessRequest({
                    query: `
                        query AuthorBook($authorId: String!) {
                            allAuthorBooks(authorId: $authorId) {
                                name
                                publishedYear
                            }
                        }
                    `,
                    variables: { authorId: author.id, id: author.books[0].id },
                });
                expect(allAuthorBooks).toEqual([
                    { name: 'Book 1 updated', publishedYear: 2000 },
                    { name: 'Book 3', publishedYear: 2003 },
                ]);
            });

            const notFoundId = '000000000000000000000000';

            it('getOne on not found', async () => {
                await dryer.makeFailRequest({
                    query: `
                        query AuthorBook($id: String!, $authorId: String!) {
                            authorBook(id: $id, authorId: $authorId) {
                                id
                                name
                                publishedYear
                            }
                        }
                    `,
                    variables: { authorId: author.id, id: notFoundId },
                    errorMessageMustContains: 'No book found with id',
                });
            });

            it('delete on not found', async () => {
                await dryer.makeFailRequest({
                    query: `
                        mutation DeleteAuthorBook($authorId: String!, $id: String!) {
                            deleteAuthorBook(authorId: $authorId, id: $id) {
                                id
                                deleted
                            }
                        }
                    `,
                    variables: { authorId: author.id, id: notFoundId },
                    errorMessageMustContains: 'No book found with id',
                });
            });

            it('update on not found', async () => {
                await dryer.makeFailRequest({
                    query: `
                        mutation UpdateAuthorBook($input: UpdateBookInput!, $authorId: String!) {
                            updateAuthorBook(input: $input, authorId: $authorId) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        input: {
                            name: 'does not matter',
                            id: notFoundId,
                        },
                        authorId: author.id,
                    },
                    errorMessageMustContains: 'No book found with id',
                });
            });
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
