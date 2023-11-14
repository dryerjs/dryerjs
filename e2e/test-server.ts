import { APP_FILTER } from '@nestjs/core';
import { Catch, DynamicModule, ExceptionFilter, INestApplication, Module, Provider } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { DryerModule, DryerModuleOptions } from 'dryerjs';
import { GraphQLError } from 'graphql';
import * as request from 'supertest';
import * as mongoose from 'mongoose';

import * as util from '../lib/util';

@Catch(GraphQLError)
export class GraphQLExceptionFilter implements ExceptionFilter {
  catch(err: GraphQLError) {
    throw err;
  }
}

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GraphQLExceptionFilter,
    },
  ],
})
class TestAppModule {
  public static init(config: TestServerConfig): DynamicModule {
    return {
      module: TestAppModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          sortSchema: true,
          playground: false,
        }),
        MongooseModule.forRoot('mongodb://127.0.0.1:27017/dryer-e2e'),
        DryerModule.register(util.omit(config, ['providers']) as any),
      ],
      providers: config.providers || [],
    };
  }
}

export type TestServerConfig = DryerModuleOptions & {
  providers?: Provider[];
};

export class TestServer {
  public app: INestApplication;

  private constructor(private readonly config: TestServerConfig) {}

  public static init(config: TestServerConfig): TestServer {
    return new TestServer(config);
  }

  public async start() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule.init(this.config)],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();
    await this.cleanDatabase();
  }

  private async cleanDatabase() {
    await Promise.all(
      this.config.definitions.map(async (definition) => {
        const model = this.app.get(getModelToken(definition.name), {
          strict: false,
        }) as mongoose.Model<any>;
        await model.deleteMany({});
        await model.ensureIndexes({});
      }),
    );
  }

  public async stop() {
    await this.cleanDatabase();
    await this.app.close();
    for (const connection of mongoose.connections) {
      await connection.close();
    }
  }

  public async makeSuccessRequest(input: {
    query: string;
    variables?: object;
    headers?: Record<string, string>;
  }) {
    const requestObject = request(this.app.getHttpServer()).post('/graphql');
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
    headers?: Record<string, string>;
    errorMessageMustContains?: string;
  }) {
    const requestObject = request(this.app.getHttpServer()).post('/graphql');

    for (const key in util.defaultTo(input.headers, {})) {
      requestObject.set(key, input.headers![key] as string);
    }
    const {
      body: { errors },
    } = await requestObject.send({
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
