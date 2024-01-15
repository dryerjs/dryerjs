import * as graphql from 'graphql';
import { Property, Definition, ObjectId, Id, GraphQLObjectId, ReferencesMany } from 'dryerjs';

@Definition()
export class Item {
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  name: string;
}

@Definition({ skipDefaultHookMethods: ['all'] })
export class Order {
  @Id()
  id: ObjectId;

  @Property({ type: () => [GraphQLObjectId], nullable: true, db: { type: [ObjectId], default: [] } })
  itemIds: ObjectId[];

  @ReferencesMany(() => Item, {
    from: 'itemIds',
    allowCreateWithin: true,
    noPopulation: false,
  })
  items: Item[];
}
