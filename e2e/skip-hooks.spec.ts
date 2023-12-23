import { TestServer } from './test-server';
import { Computer, Rating, Shop, Promotion, Specification } from '../src/models/computer';
import { Item, Order } from '../src/models';

export const dryer = TestServer.init({
  definitions: [Computer, Specification, Rating, Shop, Promotion, Order, Item],
});

describe('skip default hooks for relations works', () => {
  beforeAll(async () => {
    await dryer.start();
  });

  let computer: Computer;

  it('should be able to skipExistenceCheck for referencesMany in beforeCreate', async () => {
    const { createComputer } = await dryer.makeSuccessRequest({
      query: `
        mutation Mutation($input: CreateComputerInput!) {
          createComputer(input: $input) {
            name
            id
            ratingIds 
            specification {
              cpu
              id
            }
            promotions {
              name
              id
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'Xiaomi',
          ratingIds: ['000000000000000000000001'],
          specification: {
            cpu: 'A',
          },
          promotions: [
            {
              name: 'Adobe',
            },
            {
              name: 'JetBrains',
            },
          ],
        },
      },
    });
    computer = createComputer;
    expect(createComputer).toEqual({
      id: expect.any(String),
      name: 'Xiaomi',
      ratingIds: ['000000000000000000000001'],
      specification: expect.any(Object),
      promotions: expect.any(Object),
    });
  });

  it('should be able to skipExistenceCheck for referencesMany in beforeUpdate', async () => {
    const { updateComputer } = await dryer.makeSuccessRequest({
      query: `
        mutation UpdateComputer($input: UpdateComputerInput!) {
          updateComputer(input: $input) {
            name
            id
            ratingIds
          }
        }
        `,
      variables: {
        input: {
          id: computer.id,
          ratingIds: ['000000000000000000000002'],
        },
      },
    });
    expect(updateComputer.id).toEqual(computer.id);
    expect(updateComputer.ratingIds[0]).toEqual('000000000000000000000002');
  });

  it('should be able to skipExistenceCheck for hasMany in beforeRemove', async () => {
    const { removeComputer } = await dryer.makeSuccessRequest({
      query: `
          mutation RemoveComputer($removeComputerId: ObjectId!) {
            removeComputer(id: $removeComputerId) {
              success
            }
          }
        `,
      variables: {
        removeComputerId: computer.id,
      },
    });
    expect(removeComputer.success).toEqual(true);
  });

  let computer2: Computer;
  it('should be able to skipExistenceCheck for belongsTo in beforeCreate', async () => {
    const { createComputer } = await dryer.makeSuccessRequest({
      query: `
      mutation CreateComputer($input: CreateComputerInput!) {
        createComputer(input: $input) {
          id
          name
          shopId
        }
      }
    `,
      variables: {
        input: {
          name: 'Awesome Computer',
          shopId: '000000000000000000000000',
        },
      },
    });
    computer2 = createComputer;
    expect(createComputer).toEqual({
      id: expect.any(String),
      name: 'Awesome Computer',
      shopId: '000000000000000000000000',
    });
  });

  it('should be able to skipExistenceCheck for belongsTo in beforeUpdate', async () => {
    const { updateComputer } = await dryer.makeSuccessRequest({
      query: `
        mutation UpdateComputer($input: UpdateComputerInput!) {
          updateComputer(input: $input) {
            name
            id
            shopId
          }
        }
        `,
      variables: {
        input: {
          id: computer2.id,
          shopId: '000000000000000000000001',
        },
      },
    });
    computer2.shopId = updateComputer.shopId;
    expect(updateComputer.id).toEqual(computer2.id);
    expect(updateComputer.shopId).toEqual('000000000000000000000001');
  });

  let order: Order;

  it('should be able to skipDefaultHookMethods beforeCreate', async () => {
    const { createOrder } = await dryer.makeSuccessRequest({
      query: `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          id
          itemIds
        }
      }
    `,
      variables: {
        input: {
          itemIds: ['000000000000000000000000'],
        },
      },
    });
    order = createOrder;
    expect(createOrder).toEqual({
      id: expect.any(String),
      itemIds: ['000000000000000000000000'],
    });
  });

  it('should be able to skipDefaultHookMethods beforeUpdate', async () => {
    const { updateOrder } = await dryer.makeSuccessRequest({
      query: `
          mutation UpdateOrder($input: UpdateOrderInput!) {
            updateOrder(input: $input) {
              id
              itemIds
            }
          }
          `,
      variables: {
        input: {
          id: order.id,
          itemIds: ['000000000000000000000002'],
        },
      },
    });
    expect(updateOrder.id).toEqual(order.id);
    expect(updateOrder.itemIds[0]).toEqual('000000000000000000000002');
  });

  it('should be able to skipDefaultHookMethods beforeRemove/afterRemove', async () => {
    const { removeOrder } = await dryer.makeSuccessRequest({
      query: `
            mutation RemoveOrder($removeOrderId: ObjectId!) {
              removeOrder(id: $removeOrderId) {
                success
              }
            }
          `,
      variables: {
        removeOrderId: order.id,
      },
    });
    expect(removeOrder.success).toEqual(true);
  });

  afterAll(async () => {
    await dryer.stop();
  });
});
