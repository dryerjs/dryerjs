import * as graphql from 'graphql';
import * as util from '../util';
import { Model } from '../model';

export class DeleteService {
    public static async delete<T, Context>(id: string, _context: Context, model: Model<T>) {
        const deleted = await model.db.findByIdAndDelete(id);
        if (util.isNil(deleted)) {
            throw new graphql.GraphQLError(`No ${model.name} found with id ${id}`, {
                extensions: {
                    code: 'NOT_FOUND',
                    http: { status: 404 },
                },
            });
        }
    }
}
