import 'dotenv/config';
import { Dryer, Property } from 'dryerjs';

class User {
    @Property()
    id: string;

    @Property()
    email: string;

    @Property()
    password: string;

    @Property()
    yearOfBirth: number;

    @Property()
    createdAt: Date;

    @Property()
    updatedAt: Date;
}

async function start() {
    const dryer = Dryer.init({
        modelDefinitions: {
            User,
        },
        beforeApplicationInit: () => console.log('beforeApplicationInit'),
        afterApplicationInit: () => console.log('afterApplicationInit'),
        mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dryer?directConnection',
        port: Number(process.env.PORT || 3000),
        appendContext: () => ({ userId: '1', email: 'foo@example.com' }),
    });

    dryer.start();
}

start();
