import { Context as DryerContext } from 'dryerjs';

export type ExtraContext = {
    user: {
        userId: string;
        role: string;
    } | null;
};

export type Context = DryerContext<ExtraContext>;
