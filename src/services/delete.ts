import { Model } from '../model';
import { BaseContext } from '../dryer';
import * as must from './must';

export class DeleteService {
    public static async delete<T, Context extends BaseContext>(
        id: string,
        _context: Context,
        model: Model<T>,
    ) {
        const deleted = await model.db.findByIdAndDelete(id);
        must.found(deleted, model, id);
    }
}
