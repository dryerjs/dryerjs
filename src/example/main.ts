import 'dotenv/config';
import {
    Dryer,
    ExcludeOnInput,
    ExcludeOnOutput,
    ExcludeOnUpdate,
    Property,
    TransformOnCreate,
    TransformOnOutput,
    Validate,
} from 'dryerjs';

class User {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @ExcludeOnUpdate()
    @TransformOnOutput((_user: User, email: string, ctx: AdditionalContext) => {
        if (ctx.role === 'admin') return email;
        return `***@${email.split('@')[1]}`;
    })
    @Validate((_user: User, email: string) => {
        console.log('validate email', email);
        if (email.includes('@')) return;
        throw new Error('Invalid email');
    })
    email: string;

    @Property()
    @ExcludeOnUpdate()
    @TransformOnCreate((userInput: User, password: string) => {
        const passwordHash = require('crypto').createHash('md5').update(password).digest('hex');
        return `${userInput.email}:${passwordHash}`;
    })
    @ExcludeOnOutput()
    password: string;

    @Property()
    yearOfBirth: number;

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
