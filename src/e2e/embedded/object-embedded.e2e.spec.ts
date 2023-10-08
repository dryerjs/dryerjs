import {
    EmbeddedProperty,
    ExcludeOnCreate,
    NullableOnOutput,
    Property,
    RequiredOnCreate,
    TransformOnInput,
} from 'dryerjs';
import { DryerTest } from '../dryer-test';

enum MovieTag {
    ACTION = 'ACTION',
    COMEDY = 'COMEDY',
    DRAMA = 'DRAMA',
}

enum DirectorLevel {
    ONE = 1,
    TWO = 2,
    THREE = 3,
}

class Director {
    @Property()
    name: string;

    @Property()
    @NullableOnOutput()
    nationality: string;

    @Property({ enum: { DirectorLevel } })
    level: DirectorLevel;
}

class Movie {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @EmbeddedProperty({ type: Director })
    @NullableOnOutput()
    director: Director;

    @Property()
    @RequiredOnCreate()
    name: string;

    @Property({ enum: { MovieTag } })
    @TransformOnInput((tags: MovieTag[]) => {
        return [...new Set(tags)];
    })
    movieTags: MovieTag[];
}

export const dryer = DryerTest.init({
    modelDefinitions: [Movie],
});

describe('Object embedded feature works', () => {
    beforeAll(async () => {
        await dryer.start();
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
                    movieTags: [MovieTag.ACTION, MovieTag.ACTION, MovieTag.DRAMA],
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
                        allMovies {
                            id
                            name
                            director {
                                name
                                nationality
                            }
                            movieTags
                        }
                    }
                `,
            });

            allMovies = allMoviesResponse.allMovies;
        });

        it('should show movies with directors', async () => {
            expect(allMovies.map(movie => ({ ...movie, id: undefined }))).toEqual([
                {
                    name: 'Movie 1',
                    director: {
                        name: 'Director 1',
                        nationality: 'Nationality 1',
                    },
                    movieTags: [],
                },
                {
                    name: 'Movie 2',
                    director: null,
                    movieTags: [MovieTag.ACTION, MovieTag.DRAMA],
                },
            ]);
        });

        it('should be able to update embedded values', async () => {
            const firstMovie = allMovies[0];
            const firstUpdateResponse = await dryer.makeSuccessRequest({
                query: `
                    mutation UpdateMovie($input: UpdateMovieInput!) {
                        updateMovie(input: $input) {
                            director {
                                nationality
                                name
                            }
                        }
                    }
                `,
                variables: {
                    input: {
                        director: { name: 'updated name', nationality: null },
                        id: firstMovie.id,
                    },
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
                    mutation UpdateMovie($input: UpdateMovieInput!) {
                        updateMovie(input: $input) {
                            director {
                                nationality
                                name
                            }
                        }
                    }
                `,
                variables: {
                    input: { director: null, id: firstMovie.id },
                },
            });
            expect(firstUpdateResponse.updateMovie.director).toEqual(null);
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
