import { Catch, DynamicModule, ExceptionFilter, INestApplication, Module, Provider } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule, SchemaFactory, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Definition, DryerModule } from 'dryerjs';
import { GraphQLError } from 'graphql';
import * as request from 'supertest';
import * as mongoose from 'mongoose';
import * as mongoosePaginateV2 from '../lib/js/mongoose-paginate-v2';
import * as util from '../lib/util';
import { APP_FILTER } from '@nestjs/core';

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
        MongooseModule.forRoot('mongodb://127.0.0.1:27017/dryer-test'),
        DryerModule.register({ definitions: config.definitions }),
        MongooseModule.forFeature(
          config.definitions.map((definition) => {
            const schema = SchemaFactory.createForClass(definition);
            schema.plugin(mongoosePaginateV2);
            return {
              name: definition.name,
              schema,
            };
          }),
        ),
      ],
      providers: config.providers || [],
    };
  }
}

export type TestServerConfig = {
  definitions: Definition[];
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
  }

  public async stop() {
    for (const definition of this.config.definitions) {
      const model = this.app.get(getModelToken(definition.name), {
        strict: false,
      });
      await model.deleteMany({});
    }
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
    errorMessageMustContains?: string;
  }) {
    const {
      body: { errors },
    } = await request(this.app.getHttpServer())
      .post('/graphql')
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
