import { BaseContext } from '../dryer';
import { FilterQuery } from 'mongoose';
import { Model } from '../model';
import { OutputService } from './output';
import { Sort } from '../shared';

export class GetAllService {
    public static async getAll<T, Context extends BaseContext>(
        query: FilterQuery<T>,
        sort: Sort,
        context: Context,
        model: Model<T>,
    ) {
        const projection = {};
        const items = await model.db.find(query, projection, { sort });
        return await Promise.all(items.map(item => OutputService.output(item, context, model)));
    }
}
