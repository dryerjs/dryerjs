export class MongooseSchemaBuilder {
    public static build(classDefinition: any) {
        const instance = new classDefinition();

        const result = {};

        // Traverse through the properties and access their types
        for (const propertyName in instance) {
            const propertyValue = instance[propertyName];
            const typeConfig = {
                String,
                Date,
                Number,
            };
            result[propertyName] = { type: typeConfig[propertyValue.name] };
        }

        return result;
    }
}
