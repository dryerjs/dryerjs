import {
    CachedPropertiesByModel,
    EmbeddedProperty,
    ExcludeOnInput,
    NullableOnOutput,
    Property,
    RequiredOnCreate,
} from 'dryerjs';
import { DryerTest } from './utils';

class Director {
    @Property()
    name: string;

    @Property()
    nationality: string;
}

class Movie {
    @ExcludeOnInput()
    @Property()
    id: string;

    @EmbeddedProperty({ type: Director })
    @NullableOnOutput()
    director: Director;

    @Property()
    @RequiredOnCreate()
    name: string;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Movie],
});

describe('Object embedded feature works', () => {
    beforeAll(async () => {
        await dryer.start();
        await dryer.model(Movie).db.deleteMany({});
    });

    describe('User CRUD works', () => {
        beforeAll(async () => {
            const movieInputs = [
                {
                    name: 'Movie 1',
                    director: {
                        name: 'Director 1',
                        nationality: 'Nationality 1',
                    },
                },
                {
                    name: 'Movie 2',
                },
            ];

            for (const movieInput of movieInputs) {
                await dryer.makeSuccessRequest({
                    query: `
                        mutation CreateMovie($input: CreateMovieInput!) {
                            createMovie(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: { input: movieInput },
                });
            }
        });

        it('Happy path works', async () => {
            const allMovies = await dryer.makeSuccessRequest({
                query: `
                    query Movies {
                        movies {
                            id
                            name
                            director {
                                name
                                nationality
                            }
                        }
                    }
                `,
            });

            expect(allMovies.movies).toHaveLength(2);
        });
    });

    afterAll(async () => {
        await dryer.model(Movie).db.deleteMany({});
        await dryer.stop();
        CachedPropertiesByModel.cleanOnTest();
    });
});
