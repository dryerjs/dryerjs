import * as graphql from 'graphql';
import {
    Dryer,
    ExcludeOnInput,
    ExcludeOnOutput,
    ExcludeOnUpdate,
    NullableOnOutput,
    Property,
    RequiredOnCreate,
    TransformOnCreate,
    TransformOnOutput,
    Validate,
    ExcludeOnDatabase,
    GraphQLType,
    DryerConfig,
    DefaultOnInput,
    TransformOnInput,
    DefaultOnOutput,
    EmbeddedProperty,
    ExcludeOnCreate,
    Filterable,
} from 'dryerjs';

export class Address {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    streetAddress: string;

    @Property()
    @DefaultOnOutput(() => '000')
    postalCode: string;
}

export class Phone {
    @Property()
    @Validate((phoneNumber: string) => {
        if (phoneNumber.length >= 9) return;
        throw new graphql.GraphQLError(`Invalid phoneNumber ${phoneNumber}`, {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 400 },
            },
        });
    })
    @TransformOnCreate((phoneNumber: string) => {
        if (phoneNumber.startsWith('0')) return phoneNumber;
        return `0${phoneNumber}`;
    })
    phoneNumber: string;

    @Property()
    @DefaultOnOutput(() => '+1')
    countryPrefix: string;
}

enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export class User {
    @ExcludeOnCreate()
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
        throw new graphql.GraphQLError(`Invalid email ${email}`, {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 400 },
            },
        });
    })
    @RequiredOnCreate()
    @Filterable({ operators: ['eq', 'in'] })
    email: string;

    @Property()
    @ExcludeOnUpdate()
    @RequiredOnCreate()
    @TransformOnCreate((password: string, _ctx: AdditionalContext, userInput: User) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const passwordHash = require('crypto').createHash('md5').update(password).digest('hex');
        return `${userInput.email}:${passwordHash}`;
    })
    @ExcludeOnOutput()
    password: string;

    @Property()
    @NullableOnOutput()
    @GraphQLType(graphql.GraphQLInt)
    @DefaultOnInput(() => 1990)
    @Validate(yearOfBirth => {
        if (yearOfBirth > 1000) return;
        throw new graphql.GraphQLError(`Invalid yearOfBirth ${yearOfBirth}`, {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 400 },
            },
        });
    })
    yearOfBirth?: number;

    @Property()
    @ExcludeOnOutput()
    @ExcludeOnDatabase()
    @TransformOnInput((requestId: string) => `${requestId}-${new Date().toISOString()}`)
    requestId?: string;

    @Property({ type: String })
    @Validate((tags: string[]) => {
        if (tags.length < 4) return;
        throw new graphql.GraphQLError('Too many tags', {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 400 },
            },
        });
    })
    @TransformOnInput((tags: string[]) => tags.map(tag => tag.trim().toLowerCase()))
    tags: string[];

    @ExcludeOnInput()
    @Property()
    @TransformOnOutput((date: Date) => date.toISOString())
    @DefaultOnOutput(() => new Date())
    @GraphQLType(graphql.GraphQLString)
    lastLoggedInAt: Date;

    @ExcludeOnInput()
    @Property()
    @TransformOnOutput((date: Date) => date.toISOString())
    @GraphQLType(graphql.GraphQLString)
    createdAt: Date;

    @EmbeddedProperty({ type: Phone })
    phone: Phone;

    @EmbeddedProperty({ type: Address })
    addresses: Address[];

    @Property({ enum: { UserStatus } })
    status: UserStatus;

    @ExcludeOnInput()
    @Property()
    @TransformOnOutput((date: Date) => date.toISOString())
    @GraphQLType(graphql.GraphQLString)
    updatedAt: Date;
}

export interface AdditionalContext {
    userId: string;
    role: string;
}

export const dryerConfig: DryerConfig<AdditionalContext> = {
    modelDefinitions: [User],
    beforeApplicationInit: () => console.log('beforeApplicationInit'),
    afterApplicationInit: () => console.log('afterApplicationInit'),
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dryer-example',
    port: Number(process.env.PORT || 4000),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    appendContext: async (req, dryer) => {
        return { userId: '123', role: 'user' };
    },
};

export const dryer = Dryer.init<AdditionalContext>(dryerConfig);
