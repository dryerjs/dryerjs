import { TestServer } from './test-server';
import { Computer } from '../src/models/computer';

export const dryer = TestServer.init({
  definitions: [Computer],
});

describe('Object embedded feature works', () => {
  beforeAll(async () => {
    await dryer.start();
  });

  describe('User CRUD works', () => {
    let allComputers: Computer[];

    beforeAll(async () => {
      const computerInputs = [
        {
          name: 'Macbook',
          brand: {
            name: 'Apple',
            creator: 'John Doe',
          },
        },
        {
          name: 'Dell XPS',
        },
      ];

      for (const computerInput of computerInputs) {
        await dryer.makeSuccessRequest({
          query: `
                mutation CreateComputer($input: CreateComputerInput!) {
                    createComputer(input: $input) {
                        id
                        name
                        brand {
                            name
                            creator
                        }
                    }
                }
            `,
          variables: { input: computerInput },
        });
      }

      const allComputersResponse = await dryer.makeSuccessRequest({
        query: `
            query Computers {
                allComputers {
                    id
                    name
                    brand {
                        name
                        creator
                    }
                }
            }
        `,
      });

      allComputers = allComputersResponse.allComputers;
    });

    it('should show computers with brand', async () => {
      expect(allComputers.map((computer) => ({ ...computer, id: undefined }))).toEqual([
        {
          id: undefined,
          name: 'Macbook',
          brand: {
            name: 'Apple',
            creator: 'John Doe',
          },
        },
        {
          id: undefined,
          name: 'Dell XPS',
          brand: null,
        },
      ]);
    });

    it('should be able to update embedded values', async () => {
      const computer = allComputers[0];
      const firstUpdateResponse = await dryer.makeSuccessRequest({
        query: `
              mutation UpdateComputer($input: UpdateComputerInput!) {
                  updateComputer(input: $input) {
                      brand {
                        name
                        creator
                      }
                  }
              }
          `,
        variables: {
          input: {
            brand: { name: 'updated brand', creator: 'updated creator' },
            id: computer.id,
          },
        },
      });
      expect(firstUpdateResponse.updateComputer.brand).toEqual({
        name: 'updated brand',
        creator: 'updated creator',
      });
    });

    it('should be able to remove embedded values by setting it to null', async () => {
      const computer = allComputers[0];
      const firstUpdateResponse = await dryer.makeSuccessRequest({
        query: `
              mutation UpdateComputer($input: UpdateComputerInput!) {
                  updateComputer(input: $input) {
                      brand {
                          name
                          creator
                      }
                  }
              }
          `,
        variables: {
          input: { brand: null, id: computer.id },
        },
      });
      expect(firstUpdateResponse.updateComputer.brand).toEqual(null);
    });
  });

  afterAll(async () => {
    await dryer.stop();
  });
});
