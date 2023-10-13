import { inspect } from './inspect';
import { Property } from './metadata';

describe('Property', () => {
    it('Given non scalar property with @Property instead of @EmbeddedProperty should throw error', () => {
        class TestPhone {}
        class TestUser {
            @Property()
            phone: TestPhone;
        }
        const [phoneProperty] = inspect(TestUser).getProperties();
        try {
            phoneProperty.getScalarOrEnumType();
            fail('Should throw error');
        } catch (error) {
            expect(error.message).toContain('is not a scalar property');
        }
    });
});
