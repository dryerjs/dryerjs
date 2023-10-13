import { ExcludeOnCreate, Property, RequiredOnCreate, Schema } from '../metadata';
import { DryerTest } from './dryer-test';

@Schema({ excluded: ['all', 'delete', 'paginate', 'update'] })
class Game {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    name: string;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Game],
});

describe('Excluded works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('updateGame is not generated', async () => {
        const query = `
            mutation {
                updateGame(input: {}) {
                    id
                }
            }
        `;

        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "updateGame"',
        });
    });

    it('deleteGame is not generated', async () => {
        const query = `
            mutation {
                deleteGame(id: "123") {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "deleteGame"',
        });
    });

    it('allGames is not generated', async () => {
        const query = `
            query {
                allGames {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "allGames"',
        });
    });

    it('paginateGames is not generated', async () => {
        const query = `
            query {
                paginateGames {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "paginateGames"',
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
