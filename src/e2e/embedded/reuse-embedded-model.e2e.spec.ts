import { EmbeddedProperty, Property } from 'dryerjs';
import { DryerTest } from '../dryer-test';

class Person {
    @Property()
    id: string;

    @Property()
    name: string;
}

class Song {
    @Property()
    id: string;

    @Property()
    name: string;

    @EmbeddedProperty({ type: () => Person })
    artist: Person;
}

class Film {
    @Property()
    id: string;

    @Property()
    name: string;

    @EmbeddedProperty({ type: Person })
    artists: Person[];

    @EmbeddedProperty({ type: Person })
    actors: Person[];
}

export const dryer = DryerTest.init({
    modelDefinitions: [Song, Film],
});

describe('Reused embedded model', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('Create mutation works', async () => {
        await dryer.makeSuccessRequest({
            query: `
                mutation {
                    createSong(input: { name: "song1", artist: { name: "artist1" } }) {
                        id
                        name
                        artist {
                            id
                            name
                        }
                    }
                }
            `,
        });
        await dryer.makeSuccessRequest({
            query: `
                mutation {
                    createFilm(input: { name: "film1", artists: [{ name: "artist2" }] }) {
                        id
                    }
                }
            `,
        });
        await dryer.makeSuccessRequest({
            query: `
                mutation {
                    createFilm(input: { name: "film2", artists: [{ name: "artist3" }], actors: [{ name: "actor1" }] }) {
                        id
                    }
                }
            `,
        });
    });

    it('Get all query works', async () => {
        const data = await dryer.makeSuccessRequest({
            query: `
                query {
                    allSongs {
                        id
                        name
                        artist {
                            id
                            name
                        }
                    }
                    allFilms {
                        id
                        name
                        artists {
                            id
                            name
                        }
                        actors {
                            id
                            name
                        }
                    }
                }
            `,
        });
        expect(data.allSongs).toEqual([
            {
                id: expect.any(String),
                name: 'song1',
                artist: {
                    id: expect.any(String),
                    name: 'artist1',
                },
            },
        ]);
        expect(data.allFilms).toEqual([
            {
                id: expect.any(String),
                name: 'film1',
                artists: [
                    {
                        id: expect.any(String),
                        name: 'artist2',
                    },
                ],
                actors: [],
            },
            {
                id: expect.any(String),
                name: 'film2',
                artists: [
                    {
                        id: expect.any(String),
                        name: 'artist3',
                    },
                ],
                actors: [
                    {
                        id: expect.any(String),
                        name: 'actor1',
                    },
                ],
            },
        ]);
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
