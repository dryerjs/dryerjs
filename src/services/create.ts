import { MetadataKey } from '../metadata';
import { Model } from '../model';
import { OutputService } from './output';
import { ObjectProcessor } from './object-processor';

export class CreateService {
    public static async create<T, Context>(input: Partial<T>, context: Context, model: Model<T>) {
        await ObjectProcessor.validate({
            input,
            context,
            modelDefinition: model.definition,
        });
        const defaultAppliedInput = await ObjectProcessor.setDefaultPartial({
            obj: input,
            context,
            modelDefinition: model.definition,
            metadataKey: MetadataKey.DefaultOnCreate,
        });
        const transformedInput = await ObjectProcessor.transform({
            obj: defaultAppliedInput,
            context,
            modelDefinition: model.definition,
            metadataKey: MetadataKey.TransformOnCreate,
        });
        const value = await model.db.create(transformedInput);
        return await OutputService.output<T, Context>(value, context, model);
    }
}
