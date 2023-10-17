import * as request from 'supertest';
import { Dryer, DryerConfig } from '../';
import * as util from '../util';

export class DryerTest extends Dryer<any> {
    public static init<Context>(
        config: Pick<DryerConfig<Context>, 'modelDefinitions' | 'appendContext' | 'resolvers' | 'providers'>,
    ) {
        return new DryerTest({
            ...config,
            mongoUri: util.defaultTo(process.env.E2E_MONGO_URI, 'mongodb://127.0.0.1:27017/dryer-e2e'),
            port: 0,
            beforeApplicationInit: undefined,
            afterApplicationInit: undefined,
        });
    }

    public async stop() {
        await this.cleanDatabase();
        await super.stop();
    }

    public async start() {
        await super.start();
        await this.cleanDatabase();
    }

    private async cleanDatabase() {
        for (const model of Object.values(this.models)) {
            await model.db.deleteMany({});
        }
    }

    public async makeSuccessRequest(input: {
        query: string;
        variables?: object;
        headers?: Record<string, string>;
    }) {
        const requestObject = request(this.expressApp).post('/');
        for (const key in util.defaultTo(input.headers, {})) {
            requestObject.set(key, input.headers![key] as string);
        }
        const { body } = await requestObject.send(input);
        expect(body.errors).toBeUndefined();
        return body.data;
    }

    public async makeFailRequest(input: {
        query: string;
        variables?: object;
        errorMessageMustContains?: string;
    }) {
        const {
            body: { errors },
        } = await request(this.expressApp)
            .post('/')
            .send({
                ...input,
                errorMessageMustContains: undefined,
            });
        expect(errors).toBeTruthy();
        if (util.isString(input.errorMessageMustContains)) {
            expect(errors[0].message).toContain(input.errorMessageMustContains);
        }
        return errors;
    }
}
