import 'dotenv/config';
import { Dryer } from "../dryer";
import { Property } from "../property";

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
        models: [User],
        beforeApplicationInit: () => console.log("beforeApplicationInit"),
        afterApplicationInit: () => console.log("afterApplicationInit"),
        mongoUri: process.env.MONGO_URI,
    });

    dryer.start();
}

start();
