import { Model } from '../model';
import { MetaKey } from '../metadata';
import { BaseContext } from '../dryer';
import { OutputService } from './output';
import { ObjectProcessor } from './object-processor';
import * as must from './must';

export class UpdateService {
    public static async update<T, Context extends BaseContext>(
        id: string,
        input: Partial<T>,
        context: Context,
        model: Model<T>,
    ) {
        await ObjectProcessor.validate({
            input,
            context,
            modelDefinition: model.definition,
        });
        const defaultAppliedInput = await ObjectProcessor.setDefault({
            obj: input,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.DefaultOnUpdate,
        });
        const transformedInput = await ObjectProcessor.transform({
            obj: defaultAppliedInput,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.TransformOnUpdate,
        });
        const result = await model.db.findByIdAndUpdate(id, transformedInput, {
            new: true,
        });
        const found = must.found(result, model, id);
        return await OutputService.output<T, Context>(found, context, model);
    }
}
