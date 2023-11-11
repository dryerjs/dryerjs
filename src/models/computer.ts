import * as graphql from 'graphql';
import { Embedded, Property } from '../../lib/property';
import { Definition } from '../../lib/definition';
import { GraphQLObjectId, ObjectId } from '../../lib/shared';

@Definition()
class Creator {
  @Property(() => graphql.GraphQLString)
  name: string;
}

@Definition()
class Brand {
  @Property(() => graphql.GraphQLString)
  name: string;

  @Embedded(() => Creator)
  creator: Creator;
}

@Definition({ allowedApis: '*' })
export class Computer {
  @Property(() => GraphQLObjectId)
  id: ObjectId;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Embedded(() => Brand)
  brand: Brand;
}
