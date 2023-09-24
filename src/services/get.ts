import * as graphql from 'graphql';
import { Model } from '../type';
import { OutputService } from './output';

export class GetService {
    public static async get(id: string, context: any, model: Model<any>) {
        const result = await model.db.findById(id);
        return OutputService.output(result, context, model);
    }

    public static async getOrThrow(id: string, context: any, model: Model<any>) {
        const result = await model.db.findById(id);
        if (!result) {
            throw new graphql.GraphQLError(`No ${model.name} found with id ${id}`, {
                extensions: {
                    code: 'NOT_FOUND',
                    http: { status: 404 },
                },
            });
        }
        return OutputService.output(result, context, model);
    }
}
