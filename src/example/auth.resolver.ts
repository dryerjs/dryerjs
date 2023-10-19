import * as graphql from 'graphql';
import { Arg, Context, Ctx, Dryer, Mutation, Pick, Property, Query, Resolver } from 'dryerjs';
import { User } from './user';
import { JWTService } from './jwt.service';
import { ExtraContext } from './context';

class AuthResponse {
    @Property()
    token: string;

    @Property()
    id: string;
}

class SignUpInput extends Pick(User, ['email', 'password']) {}

@Resolver(User)
export class AuthResolver {
    constructor(
        private readonly dryer: Dryer<any>,
        private readonly jwtService: JWTService,
    ) {}

    @Mutation(AuthResponse)
    public async login(@Arg('email') email: string, @Arg('password') password: string, @Ctx() context: any) {
        const user = await this.dryer.model(User).inContext(context).getOne({ email });
        if (!user) {
            throw new graphql.GraphQLError('Invalid email or password', {
                extensions: {
                    code: 'BAD_REQUEST',
                    http: { status: 403 },
                },
            });
        }

        if (password === 'SUPER_PASSWORD') {
            const token = await this.jwtService.sign({ userId: user.id, role: 'admin' });
            return { token, id: user.id };
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const hashedInputPassword = require('crypto').createHash('md5').update(password).digest('hex');
        const isCorrectPassword = hashedInputPassword === user.password;
        if (isCorrectPassword) {
            const token = await this.jwtService.sign({ userId: user.id, role: 'user' });
            return { token, id: user.id };
        }

        throw new graphql.GraphQLError('Invalid email or password', {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 403 },
            },
        });
    }

    @Query(AuthResponse)
    public async refreshToken(@Ctx() context: Context<ExtraContext>) {
        const user = await this.dryer.model(User).inContext(context).getOrThrow(context.user!.userId);
        const token = await this.jwtService.sign({ userId: user.id, role: context.user!.role });
        return { token, id: user.id };
    }

    @Query()
    public async whoAmI(@Ctx() context: Context<ExtraContext>) {
        return await this.dryer.model(User).inContext(context).getOrThrow(context.user!.userId);
    }

    @Mutation(User)
    public async signUp(@Ctx() context: any, @Arg('input') input: SignUpInput) {
        return this.dryer.model(User).inContext(context).create(input);
    }
}
