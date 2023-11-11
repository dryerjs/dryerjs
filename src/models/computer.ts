import * as graphql from 'graphql';
import { Embedded, Property, Skip, Thunk, Definition, GraphQLObjectId, ObjectId } from '../../lib';
import { Transform } from 'class-transformer';

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

@Definition({ allowedApis: '*' })
export class Computer {
  @Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })
  @Thunk(Transform(({ obj, key }) => obj[key]))
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  name: string;

  @Embedded(() => Brand)
  brand: Brand;
}
