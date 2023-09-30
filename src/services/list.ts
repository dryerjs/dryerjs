import { Model } from '../model';
import { OutputService } from './output';

export class ListService {
    public static async list<T, Context>(
        skip: number = 0,
        take: number = 10,
        context: Context,
        model: Model<T>,
    ) {
        const result = await model.db.paginate({}, { page: skip, limit: take });
        return {
            ...result,
            docs: await Promise.all(result.docs.map(doc => OutputService.output(doc, context, model))),
        };
    }
}
