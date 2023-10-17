import { Injectable } from 'dryerjs';
import * as JWT from 'jsonwebtoken';

const JWT_PRIVATE_KEY = 'do-not-tell-anyone';

@Injectable()
export class JWTService {
    public async verify(token: string): Promise<{ userId: string, role: string }> {
        return JWT.verify(token, JWT_PRIVATE_KEY) as any;
    }

    public async sign(input: { userId: string, role: string }) {
        return JWT.sign(input, JWT_PRIVATE_KEY);
    }
}
