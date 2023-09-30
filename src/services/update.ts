import { Model } from '../model';
import { MetadataKey } from '../metadata';
import { OutputService } from './output';
import { ObjectProcessor } from './object-processor';

export class UpdateService {
    public static async update<T, Context>(id: string, input: Partial<T>, context: Context, model: Model<T>) {
        await ObjectProcessor.validate({
            input,
            context,
            modelDefinition: model.definition,
        });
        const defaultAppliedInput = await ObjectProcessor.setDefault({
            obj: input,
            context,
            modelDefinition: model.definition,
            metadataKey: MetadataKey.DefaultOnUpdate,
        });
        const transformedInput = await ObjectProcessor.setDefault({
            obj: defaultAppliedInput,
            context,
            modelDefinition: model.definition,
            metadataKey: MetadataKey.TransformOnUpdate,
        });
        const result = await model.db.findByIdAndUpdate(id, transformedInput, {
            new: true,
        });
        if (!result) {
            throw new Error('Not found');
        }
        return await OutputService.output<T, Context>(result, context, model);
    }
}
