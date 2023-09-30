import { Model } from '../model';

export class ListService {
    public static async list<T, Context>(
        skip: number = 0,
        take: number = 10,
        context: Context,
        model: Model<T>,
    ) {
        const result = await model.db.paginate({}, { page: skip, limit: take });
        return result;
    }
}
