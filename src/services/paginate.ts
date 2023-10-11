import * as util from '../util';
import { Model } from '../model';
import { BaseContext } from '../dryer';
import { OutputService } from './output';

export class PaginateService {
    public static async paginate<T, Context extends BaseContext>(
        skip: number | undefined,
        take: number | undefined,
        context: Context,
        model: Model<T>,
    ) {
        const result = await model.db.paginate(
            {},
            { page: util.defaultTo(skip, 0), limit: util.defaultTo(take, 10) },
        );
        return {
            ...result,
            docs: await Promise.all(result.docs.map(doc => OutputService.output(doc, context, model))),
        };
    }
}
