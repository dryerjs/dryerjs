import { MetadataKey } from '../metadata';
import { Model } from '../model';
import { ObjectProcessor } from './object-processor';

export class OutputService {
    public static async output<T, Context>(rawValue: T, context: Context, model: Model<T>) {
        const leanValue = (rawValue as any)['toObject'] ? (rawValue as any)['toObject']() : rawValue;
        if (!leanValue.id && leanValue._id) {
            leanValue.id = leanValue._id.toString();
        }
        const defaultAppliedResult = await ObjectProcessor.setDefault<T, Context>({
            obj: leanValue,
            context,
            modelDefinition: model.definition,
            metadataKey: MetadataKey.DefaultOnOutput,
        });
        return await ObjectProcessor.transform<T, Context>({
            obj: defaultAppliedResult,
            context,
            modelDefinition: model.definition,
            metadataKey: MetadataKey.TransformOnOutput,
        });
    }
}
