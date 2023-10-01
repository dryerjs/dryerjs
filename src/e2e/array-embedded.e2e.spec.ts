import * as graphql from 'graphql';
import {
    DefaultOnInput,
    EmbeddedProperty,
    ExcludeOnInput,
    NullableOnOutput,
    Property,
    RequiredOnCreate,
    TransformOnInput,
    Validate,
} from 'dryerjs';
import * as util from '../util';
import { DryerTest } from './dryer-test';

class Book {
    @ExcludeOnInput()
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
    @ExcludeOnInput()
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
        await dryer.model(Author).db.deleteMany({});
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

        // it('should be able to update embedded values', async () => {
        //     const firstAuthor = allAuthors[0];
        //     const firstUpdateResponse = await dryer.makeSuccessRequest({
        //         query: `
        //             mutation UpdateAuthor($updateAuthorId: String!, $input: UpdateAuthorInput!) {
        //                 updateAuthor(id: $updateAuthorId, input: $input) {
        //                     books {
        //                         nationality
        //                         name
        //                     }
        //                 }
        //             }
        //         `,
        //         variables: {
        //             input: { books: [{ name: 'updated name', nationality: null }] },
        //             updateAuthorId: firstAuthor.id,
        //         },
        //     });
        //     expect(firstUpdateResponse.updateAuthor.books).toEqual({
        //         name: 'updated name',
        //         nationality: null,
        //     });
        // });

        // it('should be able to remove embedded values by setting it to null', async () => {
        //     const firstAuthor = allAuthors[0];
        //     const firstUpdateResponse = await dryer.makeSuccessRequest({
        //         query: `
        //             mutation UpdateAuthor($updateAuthorId: String!, $input: UpdateAuthorInput!) {
        //                 updateAuthor(id: $updateAuthorId, input: $input) {
        //                     books {
        //                         nationality
        //                         name
        //                     }
        //                 }
        //             }
        //         `,
        //         variables: {
        //             input: { books: null },
        //             updateAuthorId: firstAuthor.id,
        //         },
        //     });
        //     expect(firstUpdateResponse.updateAuthor.books).toEqual(null);
        // });
    });

    afterAll(async () => {
        await dryer.model(Author).db.deleteMany({});
        await dryer.stop();
    });
});
