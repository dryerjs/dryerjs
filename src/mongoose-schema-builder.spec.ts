import { MongooseSchemaBuilder } from './mongoose-schema-builder';
import { ExcludeOnDatabase, Property } from './metadata';

class TestModelDefinition {
    @Property()
    id: string;

    @Property()
    public name: string;

    @ExcludeOnDatabase()
    public excluded: string;

    @Property()
    public createdAt: Date;
}

describe('MongooseSchemaBuilder', () => {
    it('should build a mongoose schema', () => {
        const result = MongooseSchemaBuilder.build(TestModelDefinition);
        expect(result.obj).toEqual({
            name: {
                type: String,
            },
            createdAt: {
                type: Date,
            },
        });
    });
});
