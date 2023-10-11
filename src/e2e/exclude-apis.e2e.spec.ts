import { ExcludeOnInput, Property, RequiredOnCreate, Schema } from '../metadata';
import { DryerTest } from './dryer-test';

@Schema({ exclusion: ['all', 'delete', 'paginate', 'update'] })
class Game {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    name: string;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Game],
});

describe('Exclusion works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('Game is not generated', async () => {
        const query = `
            mutation {
                Game(input: {}) {
                    id
                }
            }
        `;

        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "Game"',
        });
    });

    it('Game is not generated', async () => {
        const query = `
            mutation {
                Game(id: "123") {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "Game"',
        });
    });

    it('Game is not generated', async () => {
        const query = `
            query {
                Game {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "Game"',
        });
    });

    it('Game is not generated', async () => {
        const query = `
            query {
                Game {
                    id
                }
            }
        `;
        await dryer.makeFailRequest({
            query,
            errorMessageMustContains: 'Cannot query field "Game"',
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
