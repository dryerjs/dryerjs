import 'dotenv/config';
import { Dryer, Property, TransformOnInput, TransformOnOutput } from 'dryerjs';

class User {
    @Property()
    id: string;

    @Property()
    @TransformOnOutput((_user: User, email: string, ctx: AdditionalContext) => {
        if (ctx.role === 'admin') return email;
        return `***@${email.split('@')[1]}`;
    })
    email: string;

    @Property()
    @TransformOnInput((userInput: User, password: string) => {
        const passwordHash = require('crypto').createHash('md5').update(password).digest('hex');
        return `${userInput.email}:${passwordHash}`;
    })
    password: string;

    @Property()
    yearOfBirth: number;

    @Property()
    createdAt: Date;

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
