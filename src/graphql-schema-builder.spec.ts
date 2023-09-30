import { ExcludeOnDatabase, Property } from './metadata';
import { GraphqlTypeBuilder } from './graphql-schema-builder';

class TestModelDefinition {
    @Property()
    id: string;

    @Property()
    public name: string;

    @ExcludeOnDatabase()
    public excludedField: string;

    @Property()
    public createdAt: Date;
}

describe('GraphqlTypeBuilder', () => {
    it('should build a graphql schema', () => {
        const gqlType = GraphqlTypeBuilder.build(TestModelDefinition);
        expect(gqlType).toMatchSnapshot();
    });
});
