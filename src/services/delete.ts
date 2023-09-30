import { Model } from '../model';

export class DeleteService {
    public static async delete<T, Context>(id: string, _context: Context, model: Model<T>) {
        await model.db.findByIdAndDelete(id);
    }
}
