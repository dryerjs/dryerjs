import { BelongsTo, Definition, GraphQLObjectId, HasMany, Id, ObjectId, Property, Ref } from 'dryerjs';
import { TestServer } from './test-server';

@Definition()
export class Store {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @HasMany(() => Product, {
    to: 'storeId',
    allowCreateWithin: true,
    allowFindAll: true,
    allowPaginate: true,
  })
  products: Product[];

  @HasMany(() => Order, {
    to: 'storeId',
    allowCreateWithin: true,
    allowFindAll: true,
    allowPaginate: true,
  })
  orders: Order[];
}

@Definition()
export class Product {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => GraphQLObjectId })
  storeId: ObjectId;
}

@Definition()
export class Order {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @Property({ type: () => GraphQLObjectId })
  storeId: ObjectId;

  @BelongsTo(() => Store, { from: 'storeId' })
  store: Ref<Store>;

  @Property({ type: () => GraphQLObjectId })
  userId: ObjectId;

  @BelongsTo(() => User, { from: 'userId' })
  user: Ref<User>;
}

@Definition()
export class User {
  @Id()
  id: ObjectId;

  @Property()
  name: string;
}

const server = TestServer.init({
  definitions: [
    { definition: Store, allowedApis: '*' },
    { definition: User, allowedApis: '*' },
    { definition: Order, allowedApis: '*' },
    { definition: Product, allowedApis: '*' },
  ],
});

it('Multiple relations work', async () => {
  await server.start();
  await server.makeSuccessRequest({
    query: `
      {
        allOrders {
          id
          store { id }
          user { id }
        }
      }
    `,
    variables: {
      input: {
        name: 'Awesome store',
      },
    },
  });
  await server.stop();
});
