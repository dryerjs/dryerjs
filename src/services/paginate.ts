import { FilterQuery } from 'mongoose';
import { Model } from '../model';
import { BaseContext } from '../dryer';
import { OutputService } from './output';

export class PaginateService {
    public static async paginate<T, Context extends BaseContext>(
        query: FilterQuery<T>,
        options: { limit: number; page: number; sort: any },
        context: Context,
        model: Model<T>,
    ) {
        const result = await model.db.paginate(query, options);
        const docs = await Promise.all(result.docs.map(doc => OutputService.output(doc, context, model)));
        return {
            ...result,
            docs,
        };
    }
}
