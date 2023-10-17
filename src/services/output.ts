import { MetaKey } from '../metadata';
import { BaseContext } from '../dryer';
import { ObjectProcessor } from './object-processor';
import { ModelDefinition } from '../shared';
import { ObjectMarker } from '../object-marker';

export class OutputService {
    public static async output<T, Context extends BaseContext>(
        rawValue: T,
        context: Context,
        modelDefinition: ModelDefinition,
    ) {
        const leanedObject = await ObjectProcessor.lean<T>({
            obj: rawValue,
            modelDefinition,
        });
        const defaultAppliedResult = await ObjectProcessor.setDefault<T, Context>({
            obj: leanedObject,
            context,
            modelDefinition,
            metaKey: MetaKey.DefaultOnOutput,
        });
        const result = await ObjectProcessor.transform<T, Context>({
            obj: defaultAppliedResult,
            context,
            modelDefinition,
            metaKey: MetaKey.TransformOnOutput,
        });

        ObjectMarker.mark(result, modelDefinition);
        return result;
    }
}
