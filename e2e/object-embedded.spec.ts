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
            creator: {
              name: 'John Doe',
            },
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
                  creator {
                    name
                  }
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
                creator {
                  name
                }
              }
            }
          }
        `,
      });

      allComputers = allComputersResponse.allComputers;
    });

    it('should show computers with brand and creator', async () => {
      expect(allComputers).toEqual([
        {
          id: expect.any(String),
          name: 'Macbook',
          brand: {
            name: 'Apple',
            creator: {
              name: 'John Doe',
            },
          },
        },
        {
          id: expect.any(String),
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
                creator {
                  name
                }
              }
            }
          }
        `,
        variables: {
          input: {
            brand: { name: 'updated brand', creator: { name: 'updated creator' } },
            id: computer.id,
          },
        },
      });
      const updatedComputer = await dryer.makeSuccessRequest({
        query: `
          query Computer($computerId: ObjectId!) {
            computer(id: $computerId) {
              name
              id
              brand {
                name
                creator {
                  name
                }
              }
            }
          }
        `,
        variables: {
          computerId: computer.id,
        },
      });
      expect(firstUpdateResponse.updateComputer.brand).toEqual({
        name: 'updated brand',
        creator: { name: 'updated creator' },
      });

      expect(updatedComputer.computer.brand).toEqual({
        name: 'updated brand',
        creator: { name: 'updated creator' },
      });
    });

    it('should be able to remove brand embedded values by setting it to null', async () => {
      const computer = allComputers[0];
      const firstUpdateResponse = await dryer.makeSuccessRequest({
        query: `
          mutation UpdateComputer($input: UpdateComputerInput!) {
            updateComputer(input: $input) {
              brand {
                name
                creator { 
                  name 
                }
              }
            }
          }
        `,
        variables: {
          input: { brand: null, id: computer.id },
        },
      });

      const updatedComputer = await dryer.makeSuccessRequest({
        query: `
        query Computer($computerId: ObjectId!) {
          computer(id: $computerId) {
            name
            id
            brand {
              name
              creator {
                name
              }
            }
          }
        }
        `,
        variables: {
          computerId: computer.id,
        },
      });

      expect(firstUpdateResponse.updateComputer.brand).toEqual(null);
      expect(updatedComputer.computer.brand).toEqual(null);
    });

    it('should be able to remove creator embedded values by setting it to null', async () => {
      const computer = allComputers[0];
      const firstUpdateResponse = await dryer.makeSuccessRequest({
        query: `
          mutation UpdateComputer($input: UpdateComputerInput!) {
            updateComputer(input: $input) {
              brand {
                name
                creator { 
                  name 
                }
              }
            }
          }
        `,
        variables: {
          input: {
            brand: {
              name: 'Dell',
              creator: null,
            },
            id: computer.id,
          },
        },
      });

      const updatedComputer = await dryer.makeSuccessRequest({
        query: `
        query Computer($computerId: ObjectId!) {
          computer(id: $computerId) {
            name
            id
            brand {
              name
              creator {
                name
              }
            }
          }
        }
        `,
        variables: {
          computerId: computer.id,
        },
      });
      expect(firstUpdateResponse.updateComputer.brand.name).toEqual('Dell');
      expect(firstUpdateResponse.updateComputer.brand.creator).toEqual(null);
      expect(updatedComputer.computer.brand.name).toEqual('Dell');
      expect(updatedComputer.computer.brand.creator).toEqual(null);
    });
  });

  afterAll(async () => {
    await dryer.stop();
  });
});
