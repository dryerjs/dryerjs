import { BaseContext } from 'dryerjs';

export type ExtraContext = {
    user: {
        userId: string;
        role: string;
    } | null;
};

export type Context = ExtraContext & BaseContext;
