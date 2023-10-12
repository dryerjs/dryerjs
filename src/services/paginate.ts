import { FilterQuery } from 'mongoose';
import { Model } from '../model';
import { BaseContext } from '../dryer';
import { OutputService } from './output';

export class PaginateService {
    public static async paginate<T, Context extends BaseContext>(
        page: number,
        limit: number,
        filter: FilterQuery<T>,
        context: Context,
        model: Model<T>,
    ) {
        const result = await model.db.paginate(filter, { page, limit });
        const docs = await Promise.all(result.docs.map(doc => OutputService.output(doc, context, model)));
        return {
            ...result,
            docs,
        };
    }
}
