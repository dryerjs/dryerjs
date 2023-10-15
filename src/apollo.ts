import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import * as express from 'express';
import * as http from 'http';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as graphql from 'graphql';
import { GraphQLFieldConfigMap } from './shared';
import { BaseContext } from './dryer';

export class Apollo {
    static async start({
        queryFields,
        mutationFields,
        subscriptionFields,
        port,
        getContext,
        getWsContext,
    }: {
        queryFields: GraphQLFieldConfigMap;
        mutationFields: GraphQLFieldConfigMap;
        subscriptionFields: GraphQLFieldConfigMap;
        port: number;
        getContext: (req: express.Request) => any;
        getWsContext: (ctx: BaseContext) => any;
    }) {
        const query = new graphql.GraphQLObjectType({
            name: 'Query',
            fields: queryFields,
        });

        const mutation = new graphql.GraphQLObjectType({
            name: 'Mutation',
            fields: mutationFields,
        });

        const subscription = new graphql.GraphQLObjectType({
            name: 'Subscription',
            fields: subscriptionFields,
        });

        const app = express();
        const httpServer = http.createServer(app);

        const schema = new graphql.GraphQLSchema({
            query,
            mutation,
            subscription,
        });

        const wsServer = new WebSocketServer({
            server: httpServer,
            path: '/',
        });

        const serverCleanup = useServer(
            {
                schema,
                context: async (ctx: BaseContext) => await getWsContext(ctx),
            },
            wsServer,
        );

        // Set up Apollo Server
        const server = new ApolloServer({
            schema,
            plugins: [
                ApolloServerPluginDrainHttpServer({ httpServer }),
                {
                    async serverWillStart() {
                        return {
                            async drainServer() {
                                await serverCleanup.dispose();
                            },
                        };
                    },
                },
            ],
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
