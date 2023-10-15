import * as graphql from 'graphql';
import { Arg, Ctx, Dryer, Mutation, Pick, Property, Query, Resolver } from 'dryerjs';
import { User } from './user';

class LoginResponse {
    @Property()
    token: string;

    @Property()
    id: string;
}

class RefreshInput {
    @Property()
    id: string;

    @Property()
    action: string;
}

class SignUpInput extends Pick(User, ['email', 'password']) {}

@Resolver(User)
export class UserResolver {
    constructor(private readonly dryer: Dryer<any>) {}

    @Mutation(LoginResponse)
    public async login(@Arg('email') email: string, @Arg('password') password: string, @Ctx() context: any) {
        console.log({ email, password, context });
        if (password !== 'SUPER_PASSWORD') this.throwError();
        const user = await this.dryer.model(User).inContext(context).getOne({ email });
        if (!user) this.throwError();
        return {
            token: `token-${user!.id}`,
            id: user!.id,
        };
    }

    @Query()
    public async whoAmI(@Ctx() context: any) {
        return await this.dryer.model(User).inContext(context).getOrThrow(context.user.id);
    }

    @Mutation(User)
    public async reindex(@Ctx() context: any) {
        console.log({ context });
        return { id: '' };
    }

    @Mutation(User)
    public async signUp(@Ctx() context: any, @Arg('input') input: SignUpInput) {
        console.log({ context, input });
        return { id: '' };
    }

    @Mutation(User)
    public async refresh(@Ctx() context: any, @Arg('input') input: RefreshInput) {
        console.log(input);
        return await this.dryer.model(User).inContext(context).getOrThrow(context.user.id);
    }

    private throwError() {
        throw new graphql.GraphQLError('Invalid email or password', {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 403 },
            },
        });
    }
}
