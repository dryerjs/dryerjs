import { MetaKey, Property, RequiredOnUpdate, inspect } from './metadata';

describe('Metadata', () => {
    it('invalid enum input should throw error', () => {
        try {
            enum TestEnum {
                A = 'A',
                B = 'B',
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            class TestEnumClass {
                @Property({ enum: TestEnum })
                value: string;
            }
            throw new Error('unexpected');
        } catch (error) {
            expect(error.message).toContain('Enum should be defined as an object');
        }
    });

    it('given non embedded property, getEmbeddedModelDefinition show throw error', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestEmbedded {
            @Property()
            value: string;
        }
        try {
            const [valueProperty] = inspect(TestEmbedded).getProperties();
            valueProperty.getEmbeddedModelDefinition();
            throw new Error('unexpected');
        } catch (error) {
            expect(error.message).toContain('is not an embedded property');
        }
    });

    it('given RequiredOnUpdate property, getMetaValue should that property', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestEmbedded {
            @Property()
            @RequiredOnUpdate()
            value: string;
        }
        const [valueProperty] = inspect(TestEmbedded).getProperties(MetaKey.RequiredOnUpdate);
        expect(valueProperty.getMetaValue(MetaKey.RequiredOnUpdate)).toBe(true);
    });
});
