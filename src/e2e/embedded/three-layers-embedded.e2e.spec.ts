import { EmbeddedProperty, Property } from 'dryerjs';
import { DryerTest } from '../dryer-test';

class Room {
    @Property()
    id: string;

    @Property()
    name: string;
}

class Apartment {
    @Property()
    id: string;

    @Property()
    name: string;

    @EmbeddedProperty({ type: Room })
    rooms: Room[];
}

class Building {
    @Property()
    id: string;

    @Property()
    name: string;

    @EmbeddedProperty({ type: Apartment })
    apartments: Apartment[];
}

export const dryer = DryerTest.init({
    modelDefinitions: [Building],
});

describe('Three layers embedded works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('Create mutation works', async () => {
        const inputs = [
            {
                name: 'building1',
                apartments: [
                    {
                        name: 'apartment1',
                        rooms: [
                            {
                                name: 'room1',
                            },
                            {
                                name: 'room2',
                            },
                        ],
                    },
                    {
                        name: 'apartment2',
                        rooms: [
                            {
                                name: 'room3',
                            },
                            {
                                name: 'room4',
                            },
                        ],
                    },
                ],
            },
            {
                name: 'building2',
                apartments: [
                    {
                        name: 'apartment3',
                        rooms: [
                            {
                                name: 'room5',
                            },
                            {
                                name: 'room6',
                            },
                        ],
                    },
                    {
                        name: 'apartment4',
                        rooms: [
                            {
                                name: 'room7',
                            },
                            {
                                name: 'room8',
                            },
                        ],
                    },
                ],
            },
        ];
        for (const input of inputs) {
            await dryer.makeSuccessRequest({
                query: `
                    mutation CreateBuilding($input: CreateBuildingInput!){
                        createBuilding(input: $input) {
                            id
                        }
                    }

                `,
                variables: { input },
            });
        }
    });

    it('Get all query works', async () => {
        const { allBuildings } = await dryer.makeSuccessRequest({
            query: `
                query {
                    allBuildings {
                        name
                        apartments {
                            name
                            rooms {
                                name
                            }
                        }
                    }
                }
            `,
        });
        expect(allBuildings).toEqual([
            {
                name: 'building1',
                apartments: [
                    {
                        name: 'apartment1',
                        rooms: [
                            {
                                name: 'room1',
                            },
                            {
                                name: 'room2',
                            },
                        ],
                    },
                    {
                        name: 'apartment2',
                        rooms: [
                            {
                                name: 'room3',
                            },
                            {
                                name: 'room4',
                            },
                        ],
                    },
                ],
            },
            {
                name: 'building2',
                apartments: [
                    {
                        name: 'apartment3',
                        rooms: [
                            {
                                name: 'room5',
                            },
                            {
                                name: 'room6',
                            },
                        ],
                    },
                    {
                        name: 'apartment4',
                        rooms: [
                            {
                                name: 'room7',
                            },
                            {
                                name: 'room8',
                            },
                        ],
                    },
                ],
            },
        ]);
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
