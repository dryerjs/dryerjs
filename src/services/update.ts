import { Injectable } from 'injection-js';
import { Model } from '../model';
import { MetaKey } from '../metadata';
import { Context } from '../dryer';
import { OutputService } from './output';
import { ObjectProcessor } from './object-processor';
import * as must from './must';

@Injectable()
export class UpdateService<T, ExtraContext> {
    constructor(
        private readonly objectProcessor: ObjectProcessor<T, ExtraContext>,
        private readonly outputService: OutputService<T, ExtraContext>,
    ) {}
    public async update(id: string, input: Partial<T>, context: Context<ExtraContext>, model: Model<T>) {
        await this.objectProcessor.validate({
            input,
            context,
            modelDefinition: model.definition,
        });
        const defaultAppliedInput = await this.objectProcessor.setDefaultPartial({
            obj: input,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.DefaultOnUpdate,
        });
        const transformedInput = await this.objectProcessor.transformPartial({
            obj: defaultAppliedInput,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.TransformOnUpdate,
        });
        const updated = await model.db.findByIdAndUpdate(id, transformedInput, {
            new: true,
        });
        const found = must.found(updated, model, id);
        return await this.outputService.output(found, context, model.definition);
    }
}
