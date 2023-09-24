import { CreateService } from './create';
import { DeleteService } from './delete';
import { GetService } from './get';
import { ListService } from './list';
import { OutputService } from './output';
import { UpdateService } from './update';

export function inContext<Context>(model: any) {
    return (context: Context) => {
        return {
            create: async (input: any) => {
                return await CreateService.create(input, context, model);
            },
            update: async (id: string, input: any) => {
                return await UpdateService.update(id, input, context, model);
            },
            delete: async (id: string) => {
                return await DeleteService.delete(id, context, model);
            },
            get: async (id: string) => {
                return await GetService.get(id, context, model);
            },
            getOrThrow: async (id: string) => {
                return await GetService.getOrThrow(id, context, model);
            },
            list: async (skip: number, take: number) => {
                return await ListService.list(skip, take, context, model);
            },
            output: async (raw: any) => {
                return await OutputService.output(raw, context, model);
            },
        };
    };
}
