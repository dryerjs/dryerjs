import { ExcludeOnInput, Property, RequiredOnCreate, Schema } from '../metadata';
import { DryerTest } from './dryer-test';

@Schema({
    excludeApis: ['createMovie'],
})
class Movie {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    name: string;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Movie],
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
            `Unknown type "CreateMovieInput". Did you mean "UpdateMovieInput`,
        );
    });

    afterAll(async () => {
        await dryer.model(Movie).db.deleteMany({});
        await dryer.stop();
    });
});
