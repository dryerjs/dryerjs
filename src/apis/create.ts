import { Api } from './type';

export class CreateApi implements Api {
    constructor(private model: any) {}

    public getEndpoint() {
        return {
            [`create${this.model.name}`]: {
                type: this.model.graphql.output,
                args: { input: { type: this.model.graphql.create } },
                resolve: async (_parent: any, { input }, context: any) => {
                    await this.validate(input, context);
                    const transformedInput = await this.transform(input, context);
                    return this.model.db.create(transformedInput);
                },
            },
        };
    }

    private async validate(input: any, context: any) {
        const properties = this.model.properties;
        for (const property of properties) {
            if (input[property] === undefined) continue;
            const validateFn = Reflect.getMetadata('validate', this.model, property);
            if (!validateFn) continue;
            await validateFn(input[property], input, context);
        }
    }

    private async transform(input: any, context: any) {
        const properties = this.model.properties;
        const transformedInput = {};
        for (const property of properties) {
            const transformOnCreate = Reflect.getMetadata('transformOnCreate', this.model, property);
            const transformOnInput = Reflect.getMetadata('transformOnInput', this.model, property);
            const transformFn = transformOnCreate || transformOnInput;
            if (!transformFn) {
                transformedInput[property] = input[property];
                continue;
            }
            transformedInput[property] = await transformFn(input[property], input, context);
        }
        return transformedInput;
    }
}
