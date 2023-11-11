import * as graphql from 'graphql';
import { Embedded, Property, Definition, ObjectId, Id } from '../../lib';

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
  @Id()
  id: ObjectId;

  @Property({ type: () => graphql.GraphQLString })
  name: string;

  @Embedded(() => Brand)
  brand: Brand;
}
