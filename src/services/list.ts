import { Model } from '../model';
import { OutputService } from './output';

export class ListService {
    public static async list<T, Context>(skip: number, take: number, context: Context, model: Model<T>) {
        const items = await model.db.find().skip(skip).limit(take);
        return await Promise.all(items.map(item => OutputService.output(item, context, model)));
    }
}
