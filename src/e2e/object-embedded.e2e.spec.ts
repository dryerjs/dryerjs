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
    @NullableOnOutput()
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
        let allMovies: Movie[];

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

            const allMoviesResponse = await dryer.makeSuccessRequest({
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

            allMovies = allMoviesResponse.movies;
        });

        it('should show movies with directors', async () => {
            expect(allMovies.map(movie => ({ ...movie, id: undefined }))).toEqual([
                {
                    name: 'Movie 1',
                    director: {
                        name: 'Director 1',
                        nationality: 'Nationality 1',
                    },
                },
                {
                    name: 'Movie 2',
                    director: null,
                },
            ]);
        });

        it('should be able to update embedded values', async () => {
            const firstMovie = allMovies[0];
            const firstUpdateResponse = await dryer.makeSuccessRequest({
                query: `
                    mutation UpdateMovie($updateMovieId: String!, $input: UpdateMovieInput!) {
                        updateMovie(id: $updateMovieId, input: $input) {
                            director {
                                nationality
                                name
                            }
                        }
                    }
                `,
                variables: {
                    input: { director: { name: 'updated name', nationality: null } },
                    updateMovieId: firstMovie.id,
                },
            });
            expect(firstUpdateResponse.updateMovie.director).toEqual({
                name: 'updated name',
                nationality: null,
            });
        });

        it('should be able to remove embedded values by setting it to null', async () => {
            const firstMovie = allMovies[0];
            const firstUpdateResponse = await dryer.makeSuccessRequest({
                query: `
                    mutation UpdateMovie($updateMovieId: String!, $input: UpdateMovieInput!) {
                        updateMovie(id: $updateMovieId, input: $input) {
                            director {
                                nationality
                                name
                            }
                        }
                    }
                `,
                variables: {
                    input: { director: null },
                    updateMovieId: firstMovie.id,
                },
            });
            expect(firstUpdateResponse.updateMovie.director).toEqual(null);
        });
    });

    afterAll(async () => {
        await dryer.model(Movie).db.deleteMany({});
        await dryer.stop();
        CachedPropertiesByModel.cleanOnTest();
    });
});
