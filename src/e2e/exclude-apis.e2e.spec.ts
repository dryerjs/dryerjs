import { ExcludeOnInput, Property, RequiredOnCreate, Schema } from '../metadata';
import { DryerTest } from './dryer-test';

@Schema({ exclusion: ['all', 'delete', 'paginate', 'update'] })
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

describe('Exclusion works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('updateMovie is not generated', async () => {
        const query = `
            mutation {
                updateMovie(input: {}) {
                    id
                }
            }
        `;

        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "updateMovie"',
        });
    });

    it('deleteMovie is not generated', async () => {
        const query = `
            mutation {
                deleteMovie(id: "123") {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "deleteMovie"',
        });
    });

    it('allMovies is not generated', async () => {
        const query = `
            query {
                allMovies {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "allMovies"',
        });
    });

    it('paginateMovies is not generated', async () => {
        const query = `
            query {
                paginateMovies {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "paginateMovies"',
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
