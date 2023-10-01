import { BaseTypeBuilder } from './graphql-schema-builder';
import { Property, inspect } from './metadata';

describe('GraphQLSchemaBuilder', () => {
    describe('BaseTypeBuilder', () => {
        it('Given non scalar property with @Property instead of @EmbeddedProperty should throw error', () => {
            class TestPhone {}
            class TestUser {
                @Property()
                phone: TestPhone;
            }
            const [phoneProperty] = inspect(TestUser).getProperties();
            try {
                BaseTypeBuilder.prototype['getPropertyBaseType'](phoneProperty);
                fail('Should throw error');
            } catch (error) {
                expect(error.message).toContain('Invalid type for property');
            }
        });
    });
});
