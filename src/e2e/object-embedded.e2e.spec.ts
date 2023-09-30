import { EmbeddedProperty, ExcludeOnInput, NullableOnOutput, Property, RequiredOnCreate } from 'dryerjs';
import { DryerTest } from './utils';

type PaginatedType<T> = {
    docs: T[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

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
        let paginatedMovies: PaginatedType<Movie>;

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
                        getAllMovies {
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

            allMovies = allMoviesResponse.getAllMovies;

            const paginatedMoviesResponse = await dryer.makeSuccessRequest({
                query: `
                    query Movies {
                        movies {
                            docs {
                                id
                                name
                                director {
                                    name
                                    nationality
                                }
                            },
                            totalDocs
                            totalPages
                            page
                            limit
                            hasNextPage
                            hasPrevPage
                        }
                    }
                `,
            });

            paginatedMovies = paginatedMoviesResponse.movies;
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

        it("should be able to get a pagination object with the movies' directors", async () => {
            expect(paginatedMovies.docs.map(movie => ({ ...movie, id: undefined }))).toEqual([
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
            expect(paginatedMovies.totalDocs).toEqual(2);
            expect(paginatedMovies.totalPages).toEqual(1);
            expect(paginatedMovies.page).toEqual(1);
            expect(paginatedMovies.limit).toEqual(10);
            expect(paginatedMovies.hasNextPage).toEqual(false);
            expect(paginatedMovies.hasPrevPage).toEqual(false);
        });
    });

    afterAll(async () => {
        await dryer.model(Movie).db.deleteMany({});
        await dryer.stop();
    });
});
