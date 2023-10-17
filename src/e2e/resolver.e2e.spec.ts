import { getIntrospectionQuery, GraphQLString } from 'graphql';
import {
    Arg,
    ExcludeOnCreate,
    NullableOnOutput,
    Omit,
    Partial,
    Pick,
    Property,
    Query,
    Required,
    RequiredOnCreate,
    Resolver,
} from 'dryerjs';
import { DryerTest } from './dryer-test';

export class Account {
    @Property()
    @ExcludeOnCreate()
    id: string;

    @Property()
    @RequiredOnCreate()
    email: string;

    @Property()
    @RequiredOnCreate()
    password: string;

    @Property()
    @NullableOnOutput()
    name: string;
}

class OmitCreateAccountInput extends Omit(Account, ['id']) {}

class PickCreateAccountInput extends Pick(Account, ['email', 'password', 'name']) {}

class PartialOfPickCreateAccountInput extends Partial(PickCreateAccountInput) {}

class RequiredOfPickCreateAccountInput extends Required(PickCreateAccountInput) {}

@Resolver(Account)
class AccountResolver {
    @Query(OmitCreateAccountInput)
    omit(@Arg('input') input: OmitCreateAccountInput) {
        return input;
    }

    @Query(GraphQLString)
    nullableInput(@Arg('email', false) email?: string) {
        return email || 'emtpy@email.com';
    }

    @Query(PickCreateAccountInput)
    pick(@Arg('input') input: PickCreateAccountInput) {
        return input;
    }

    @Query(PartialOfPickCreateAccountInput)
    partial(@Arg('input') input: PartialOfPickCreateAccountInput) {
        return input;
    }

    @Query(RequiredOfPickCreateAccountInput)
    require(@Arg('input') input: RequiredOfPickCreateAccountInput) {
        return input;
    }
}

export const dryer = DryerTest.init({
    modelDefinitions: [Account],
    resolvers: [AccountResolver],
});

describe('Resolver works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('Generate correct graphql schema', async () => {
        const query = getIntrospectionQuery();
        const response = await dryer.apolloServer.executeOperation({
            query,
        });
        const ignoreTypeNames = [
            'String',
            'Int',
            'Boolean',
        ];
        const types = response.body['singleResult'].data.__schema.types.filter(({ name }) => {
            return !ignoreTypeNames.includes(name) && !name.startsWith('__');
        });
        expect(types).toMatchSnapshot();
    });

    it('nullableInput', async () => {
        const response1 = await dryer.makeSuccessRequest({
            query: `
                query {
                    nullableInput
                }
            `,
        });

        const response2 = await dryer.makeSuccessRequest({
            query: `
                query NullableInput($email: String) {
                    nullableInput(email: $email)
                }
            `,
            variables: { email: 'real@email.com' },
        });

        expect(response1.nullableInput).toEqual('emtpy@email.com');
        expect(response2.nullableInput).toEqual('real@email.com');
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
