import * as graphql from 'graphql';
import { Model } from '../model';
import { OutputService } from './output';
import * as util from '../util';

export class GetService {
    public static async get<T, Context>(id: string, context: Context, model: Model<T>) {
        const result = await model.db.findById(id);
        if (util.isNil(result)) return null;
        return OutputService.output<T, Context>(result, context, model);
    }

    public static async getOrThrow<T, Context>(id: string, context: Context, model: Model<T>) {
        const result = await this.get<T, Context>(id, context, model);
        if (util.isNil(result)) {
            throw new graphql.GraphQLError(`No ${model.name} found with id ${id}`, {
                extensions: {
                    code: 'NOT_FOUND',
                    http: { status: 404 },
                },
            });
        }
        return result;
    }
}
