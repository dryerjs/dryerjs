import { ExcludeOnInput, Property, RequiredOnCreate, Schema } from '../metadata';
import { ApiType } from '../type';
import { DryerTest } from './dryer-test';

@Schema({
    excludeApis: [ApiType.Create, ApiType.Update, ApiType.Delete, ApiType.GetAll, ApiType.List],
})
class Movie {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    name: string;
}

class Category {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    name: string;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Movie, Category],
});

describe('ExcludeApis feature works', () => {
    beforeAll(async () => {
        await dryer.start();
        await dryer.model(Movie).db.deleteMany({});
    });

    it('createMovie is not generated', async () => {
        const query = `
            mutation CreateMovie($input: CreateMovieInput!) {
                createMovie(input: $input) {
                    id
                }
            }
        `;

        const variables = {
            input: { name: 'Movie 1' },
        };

        const response = await dryer.makeFailRequest({ query, variables });
        expect(response[0].message).toContain(
            `Unknown type "CreateMovieInput".`,
        );
    });

    it('updateMovie is not generated', async () => {
        const query = `
            mutation UpdateMovie($id: String!, $input: UpdateMovieInput!) {
                updateMovie(id: $id, input: $input) {
                    id
                }
            }
        `;
        const variables = {
            id: '123',
            input: { name: 'Movie 1' },
        };

        const response = await dryer.makeFailRequest({ query, variables });
        expect(response[0].message).toContain(
            `Unknown type "UpdateMovieInput".`,
        );
    });

    it('deleteMovie is not generated', async () => {
        const query = `
            mutation DeleteMovie($id: String!) {
                deleteMovie(id: $id) {
                    id
                }
            }
        `;
        const variables = {
            id: '123',
        };

        const response = await dryer.makeFailRequest({ query, variables });
        expect(response[0].message).toContain(`Cannot query field "deleteMovie"`);
    })

    it('allMovies is not generated', async () => {
        const query = `
            query AllMovies {
                allMovies {
                    id
                }
            }
        `;

        const response = await dryer.makeFailRequest({ query });
        expect(response[0].message).toContain(`Cannot query field "allMovies"`);
    });

    it('paginateMovies is not generated', async () => {
        const query = `
            query PaginateMovies {
                paginateMovies {
                    id
                }
            }
        `;

        const response = await dryer.makeFailRequest({ query });
        expect(response[0].message).toContain(`Cannot query field "paginateMovies"`);
    });

    it('getMovie is generated', async () => {
        const query = `
            query GetMovie($id: String!) {
                getMovie(id: $id) {
                    id
                    name
                }
            }
        `;
        const variables = {
            id: '123',
        };

        const response = await dryer.makeFailRequest({ query, variables });
        expect(response[0].message).toContain(`Cannot query field "getMovie"`);
    });

    afterAll(async () => {
        await dryer.model(Movie).db.deleteMany({});
        await dryer.stop();
    });
});
