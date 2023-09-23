import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as graphql from 'graphql';
import { ContextFunction } from './type';

export class Apollo {
    constructor() {}

    static async start({
        queryFields,
        mutationFields,
        port,
        getContext,
    }: {
        queryFields: graphql.GraphQLFieldConfigMap<any, any>;
        mutationFields: graphql.GraphQLFieldConfigMap<any, any>;
        port: number;
        getContext: Function;
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
                console.log(`🚀 Server ready at PORT=${port}`);
                process.on('SIGINT', () => {
                    console.log('Received SIGINT. Shutting down gracefully...');
                    server.stop().then(() => {
                        console.log('Server stopped.');
                        process.exit(0); // Exit the process
                    });
                });
                resolve();
            });
        });

        return {
            apolloServer: server,
            expressApp: app,
        };
    }
}
