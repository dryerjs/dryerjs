import * as graphql from 'graphql';
import {
  Embedded,
  Property,
  Definition,
  ObjectId,
  Id,
  HasOne,
  GraphQLObjectId,
  Ref,
  BelongsTo,
  ReferencesMany,
  HasMany,
} from '../../lib';

@Definition()
class Creator {
  @Property()
  name: string;
}

@Definition()
class Brand {
  @Property()
  name: string;

  @Embedded(() => Creator)
  creator: Creator;
}

@Definition({ allowedApis: '*', removalConfig: { allowCleanUpRelationsAfterRemoved: true } })
export class Feedback {
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  review: string;

  @Property({ db: { unique: true } })
  username: string;
}

@Definition({ allowedApis: '*' })
export class Specification {
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  hardware: string;

  @BelongsTo(() => Computer, { from: 'computerId', skipExistenceCheck: true })
  computer: Ref<Computer>;

  @Property({ type: () => GraphQLObjectId })
  computerId: ObjectId;
}

@Definition({ allowedApis: '*' })
export class Shop {
  @Id()
  id: ObjectId;

  @Property()
  name: string;

  @HasMany(() => Computer, {
    to: 'shopId',
    allowCreateWithin: false,
    allowFindAll: false,
    allowPaginate: false,
  })
  computers: Computer[];
}

@Definition({ allowedApis: '*' })
export class Software {
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  name: string;

  @Property({ type: () => GraphQLObjectId })
  computerId: ObjectId;

  @BelongsTo(() => Computer, { from: 'computerId' })
  computer: Ref<Computer>;
}

@Definition({ allowedApis: '*', removalConfig: { allowCleanUpRelationsAfterRemoved: true } })
export class Computer {
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  name: string;

  @Embedded(() => Brand)
  brand: Brand;

  @HasOne(() => Specification, { to: 'computerId', allowCreateWithin: true, skipRelationCheckOnRemove: true })
  specification: Specification;

  @Property({ type: () => [GraphQLObjectId], nullable: true, db: { type: [ObjectId], default: [] } })
  feedbackIds: ObjectId[];

  @ReferencesMany(() => Feedback, {
    from: 'feedbackIds',
    allowCreateWithin: true,
    noPopulation: false,
    skipExistenceCheck: true,
    skipRelationCheckOnRemove: true,
  })
  feedbacks: Feedback[];

  @BelongsTo(() => Shop, { from: 'shopId', noPopulation: true, skipExistenceCheck: true })
  shop: Ref<Shop>;

  @Property({ type: () => GraphQLObjectId, nullable: true })
  shopId: ObjectId;

  @HasMany(() => Software, {
    to: 'computerId',
    allowCreateWithin: true,
    allowFindAll: true,
    allowPaginate: true,
    skipRelationCheckOnRemove: true,
  })
  softwares: Software[];
}
