import { Model } from '../type';
import { OutputService } from './output';

export class ListService {
    public static async list(skip: number, take: number, context: any, model: Model<any>) {
        const items = await model.db.find().skip(skip).limit(take);
        return Promise.all(items.map((item) => OutputService.output(item, context, model)))
    }
}
