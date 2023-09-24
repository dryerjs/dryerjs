import { Model } from '../type';

export class DeleteService {
    public static async delete(id: string, _context: any, model: Model<any>) {
        await model.db.findByIdAndDelete(id);
    }
}
