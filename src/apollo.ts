import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import * as express from 'express';
import * as http from 'http';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as graphql from 'graphql';

export class Apollo {
    static async start({
        queryFields,
        mutationFields,
        port,
        getContext,
    }: {
        queryFields: graphql.GraphQLFieldConfigMap<any, any>;
        mutationFields: graphql.GraphQLFieldConfigMap<any, any>;
        port: number;
        getContext: (req: express.Request) => any;
    }) {
        const query = new graphql.GraphQLObjectType({
            name: 'Query',
            fields: queryFields,
        });

        const mutation = new graphql.GraphQLObjectType({
            name: 'Mutation',
            fields: mutationFields,
        });

        const app = express();
        const httpServer = http.createServer(app);

        // Set up Apollo Server
        const server = new ApolloServer({
            schema: new graphql.GraphQLSchema({
                query,
                mutation,
            }),
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        });
        await server.start();

        app.use(
            cors(),
            bodyParser.json(),
            expressMiddleware(server, {
                context: async ({ req }) => {
                    return await getContext(req);
                },
            }),
        );

        await new Promise<void>(resolve => {
            httpServer.listen({ port }, () => {
                /* istanbul ignore next */
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`🚀 Server ready at PORT=${port}`);
                }
                resolve();
            });
        });

        return {
            apolloServer: server,
            expressApp: app,
        };
    }
}
