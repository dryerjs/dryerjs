import { Injectable } from 'injection-js';
import { FilterQuery } from 'mongoose';
import { Model } from '../model';
import * as util from '../util';
import { OutputService } from './output';
import * as must from './must';
import { Context } from '../dryer';

@Injectable()
export class GetService<T, ExtraContext> {
    constructor(private readonly outputService: OutputService<T, ExtraContext>) {}

    public async get(id: string, context: Context<ExtraContext>, model: Model<T>) {
        return this.getOne(context, model, { _id: id });
    }

    public async getOrThrow(id: string, context: Context<ExtraContext>, model: Model<T>): Promise<T> {
        const result = await this.get(id, context, model);
        return must.found(result, model, id);
    }

    public async getOne(context: Context<ExtraContext>, model: Model<T>, filter: FilterQuery<T>) {
        const result = await model.db.findOne(filter);
        if (util.isNil(result)) return null;
        return this.outputService.output(result, context, model.definition);
    }
}
