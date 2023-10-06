import * as must from './must';
import { Model } from '../model';

export class DeleteService {
    public static async delete<T, Context>(id: string, _context: Context, model: Model<T>) {
        const deleted = await model.db.findByIdAndDelete(id);
        must.found(deleted, model, id);
    }
}
