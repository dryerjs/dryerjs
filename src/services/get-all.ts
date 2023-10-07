import { Model } from '../model';
import { OutputService } from './output';

export class GetAllService {
    public static async getAll<T, Context>(context: Context, model: Model<T>, filter: any) {
        const items = await model.db.find(filter);
        return await Promise.all(items.map(item => OutputService.output(item, context, model)));
    }
}
