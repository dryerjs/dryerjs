import { Injectable } from 'injection-js';
import { FilterQuery } from 'mongoose';
import { Model } from '../model';
import { Context } from '../dryer';
import { OutputService } from './output';

@Injectable()
export class PaginateService<T, ExtraContext> {
    constructor(private readonly outputService: OutputService<T, ExtraContext>) {}

    public async paginate(
        query: FilterQuery<T>,
        options: { limit: number; page: number; sort: any },
        context: Context<ExtraContext>,
        model: Model<T>,
    ) {
        const result = await model.db.paginate(query, options);
        const docs = await Promise.all(
            result.docs.map(doc => this.outputService.output(doc, context, model.definition)),
        );
        return {
            ...result,
            docs,
        };
    }
}
