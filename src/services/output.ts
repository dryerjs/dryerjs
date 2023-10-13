import { MetaKey } from '../metadata';
import { Model } from '../model';
import { BaseContext } from '../dryer';
import { ObjectProcessor } from './object-processor';

export class OutputService {
    public static async output<T, Context extends BaseContext>(
        rawValue: T,
        context: Context,
        model: Model<T>,
    ) {
        const leanedObject = await ObjectProcessor.lean<T>({
            obj: rawValue,
            modelDefinition: model.definition,
        });
        const defaultAppliedResult = await ObjectProcessor.setDefault<T, Context>({
            obj: leanedObject,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.DefaultOnOutput,
        });
        return await ObjectProcessor.transform<T, Context>({
            obj: defaultAppliedResult,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.TransformOnOutput,
        });
    }
}
