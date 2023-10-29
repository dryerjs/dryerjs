import * as graphql from 'graphql';
import { Embedded, Property, Thunk } from '../lib/property';
import { TestServer } from './test-server';
import { Field } from '@nestjs/graphql';
import { CreateInputType, OutputType, UpdateInputType } from '../lib/type-functions';
import { Definition } from '../lib/definition';
import { Prop, SchemaFactory } from '@nestjs/mongoose';

@Definition()
class Brand {
  @Property(() => graphql.GraphQLString)
  name: string;
}

@Definition({ allowedApis: '*' })
export class Computer {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: [SchemaFactory.createForClass(Brand)] })
  @Thunk(Field(() => OutputType(Brand)), { scopes: 'output' })
  @Thunk(Field(() => CreateInputType(Brand), { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => UpdateInputType(Brand), { nullable: true }), { scopes: 'update' })
  @Embedded(() => Brand)
  brand: Brand;
}

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
                    }
                }
            }
        `,
      });

      allComputers = allComputersResponse.allComputers;
    });

    it('should show computers with brand', async () => {
      expect(allComputers.map((computer) => ({ ...computer, id: undefined }))).toEqual([
        {
          name: 'Macbook',
          brand: {
            name: 'Apple',
          },
        },
        {
          name: 'Dell XPS',
        },
      ]);
    });
  });

  afterAll(async () => {
    await dryer.stop();
  });
});
