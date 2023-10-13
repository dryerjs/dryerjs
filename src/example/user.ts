import * as graphql from 'graphql';
import {
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
    DefaultOnInput,
    TransformOnInput,
    DefaultOnOutput,
    EmbeddedProperty,
    ExcludeOnCreate,
    Filterable,
    Sortable,
    Index,
} from 'dryerjs';
import { Phone } from './phone';
import { Address } from './address';
import { AdditionalContext } from './context';

enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

@Index({ email: 1 }, { unique: true })
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
    @Filterable({ operators: ['exists', 'gt', 'gte', 'lt', 'lte'] })
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
    @Sortable()
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
