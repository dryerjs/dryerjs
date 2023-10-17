import { Dryer, DryerConfig } from 'dryerjs';
import { AdditionalContext } from './context';
import { User } from './user';
import { AuthResolver } from './auth.resolver';
import { JWTService } from './jwt.service';

export const dryerConfig: DryerConfig<AdditionalContext> = {
    modelDefinitions: [User],
    beforeApplicationInit: () => console.log('beforeApplicationInit'),
    afterApplicationInit: () => console.log('afterApplicationInit'),
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dryer-example',
    port: Number(process.env.PORT || 4000),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    appendContext: async (req, dryer) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return { userId: null, role: null };
        return await (dryer.injector.get(JWTService) as JWTService).verify(token);
    },
    providers: [JWTService],
    resolvers: [AuthResolver],
};

export const dryer = Dryer.init<AdditionalContext>(dryerConfig);
