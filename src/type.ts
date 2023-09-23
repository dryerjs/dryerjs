import { Request } from 'express';

export type ModelDefinition<T = any> = new (...args: any[]) => T;

export type AnyClass = new (...args: any[]) => any;

export type ContextFunction<Context> = (req: Request) => Context | Promise<Context>;

export interface DryerConfig<Context = any> {
    modelDefinitions: { [key: string]: any };
    beforeApplicationInit?: Function;
    afterApplicationInit?: Function;
    mongoUri: string;
    port: number;
    appendContext?: ContextFunction<Context>;
}
