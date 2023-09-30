import * as request from 'supertest';
import { Dryer, DryerConfig } from '../';

export class DryerTest extends Dryer<any> {
    public static init<Context>(config: Pick<DryerConfig<Context>, 'modelDefinitions' | 'appendContext'>) {
        return new DryerTest({
            ...config,
            mongoUri: process.env.E2E_MONGO_URI || 'mongodb://127.0.0.1:27017/dryer-e2e?directConnection=true',
            port: 0,
            beforeApplicationInit: undefined,
            afterApplicationInit: undefined,
        });
    }

    async makeSuccessRequest(input: { query: string; variables?: object }) {
        const { body: { data, errors } } = await request(this.expressApp).post('/').send(input);
        expect(errors).toBeUndefined();
        return data;
    };

    async makeFailRequest(input: { query: string; variables?: object, errorMessageMustContains?: string }, ) {
        const { body: { data, errors } } = await request(this.expressApp).post('/').send({
            ...input,
            errorMessageMustContains: undefined,
        });
        expect(errors).toBeTruthy();
        expect(data).toBeNull();
        if (input.errorMessageMustContains) {
            expect(errors[0].message).toContain(input.errorMessageMustContains);
        }
        return errors;
    };
}
