import { FilterQuery } from 'mongoose';
import { Model } from '../model';
import * as util from '../util';
import { OutputService } from './output';
import * as must from './must';
import { BaseContext } from '../dryer';

export class GetService {
    public static async get<T, Context extends BaseContext>(id: string, context: Context, model: Model<T>) {
        const result = await model.db.findById(id);
        if (util.isNil(result)) return null;
        return OutputService.output<T, Context>(result, context, model.definition);
    }

    public static async getOrThrow<T, Context extends BaseContext>(
        id: string,
        context: Context,
        model: Model<T>,
    ): Promise<T> {
        const result = await this.get<T, Context>(id, context, model);
        return must.found(result, model, id);
    }

    public static async getOne<T, Context extends BaseContext>(
        context: Context,
        model: Model<T>,
        filter: FilterQuery<T>,
    ) {
        const result = await model.db.findOne(filter);
        if (util.isNil(result)) return null;
        return OutputService.output<T, Context>(result, context, model.definition);
    }
}
