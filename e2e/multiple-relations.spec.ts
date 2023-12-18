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
    allowCreateWithin: false,
    allowFindAll: false,
    allowPaginate: false,
  })
  products: Product[];

  @HasMany(() => Order, {
    to: 'storeId',
    allowCreateWithin: false,
    allowFindAll: false,
    allowPaginate: false,
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

  @BelongsTo(() => Store, { from: 'storeId', noPopulation: true })
  store: Ref<Store>;

  @Property({ type: () => GraphQLObjectId })
  userId: ObjectId;

  @BelongsTo(() => User, { from: 'userId', noPopulation: true })
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
  definitions: [Store, User, Order, Product],
});

it('BelongsTo works', async () => {
  await server.start();
  await server.stop();
});
