import * as graphql from 'graphql';
import { Embedded, Property } from '../../lib/property';
import { Definition } from '../../lib/definition';

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
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Embedded(() => Brand)
  brand: Brand;
}
