import { Injectable } from 'injection-js';
import { Context } from '../dryer';
import { FilterQuery } from 'mongoose';
import { Model } from '../model';
import { OutputService } from './output';
import { Sort } from '../shared';

@Injectable()
export class GetAllService<T, ExtraContext> {
    constructor(private readonly outputService: OutputService<T, ExtraContext>) {}

    public async getAll(query: FilterQuery<T>, sort: Sort, context: Context<ExtraContext>, model: Model<T>) {
        const projection = {};
        const items = await model.db.find(query, projection, { sort });
        return await Promise.all(
            items.map(item => this.outputService.output(item, context, model.definition)),
        );
    }
}
