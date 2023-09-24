import 'dotenv/config';
import * as graphql from 'graphql';
import {
    Dryer,
    ExcludeOnInput,
    ExcludeOnOutput,
    ExcludeOnUpdate,
    NullableOnOutput,
    Property,
    NotNullOnCreate,
    TransformOnCreate,
    TransformOnOutput,
    Validate,
    ExcludeOnDatabase,
    GraphQLType,
    DefaultOnOutput,
} from 'dryerjs';

class User {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @ExcludeOnUpdate()
    @TransformOnOutput((email: string, ctx: AdditionalContext) => {
        if (ctx.role === 'admin') return email;
        return `***@${email.split('@')[1]}`;
    })
    @Validate((email: string) => {
        if (email.includes('@')) return;
        throw new Error('Invalid email');
    })
    @NotNullOnCreate()
    email: string;

    @Property()
    @ExcludeOnUpdate()
    @NotNullOnCreate()
    @TransformOnCreate((password: string, _ctx: AdditionalContext, userInput: User) => {
        const passwordHash = require('crypto').createHash('md5').update(password).digest('hex');
        return `${userInput.email}:${passwordHash}`;
    })
    @ExcludeOnOutput()
    password: string;

    @Property()
    @NullableOnOutput()
    @GraphQLType(graphql.GraphQLInt)
    @DefaultOnOutput(() => 1990)
    yearOfBirth?: number;

    @Property()
    @ExcludeOnOutput()
    @ExcludeOnDatabase()
    requestId?: string;

    @ExcludeOnInput()
    @Property()
    createdAt: Date;

    @ExcludeOnInput()
    @Property()
    updatedAt: Date;
}

interface AdditionalContext {
    userId: string;
    role: string;
}

async function start() {
    const dryer = Dryer.init<{ User }, AdditionalContext>({
        modelDefinitions: {
            User,
        },
        beforeApplicationInit: () => console.log('beforeApplicationInit'),
        afterApplicationInit: () => console.log('afterApplicationInit'),
        mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dryer?directConnection=true',
        port: Number(process.env.PORT || 4000),
        appendContext: (_req, _models) => {
            return { userId: '123', role: 'user' };
        },
    });

    dryer.start();
}

start();
