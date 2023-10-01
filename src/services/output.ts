import * as util from '../util';
import { MetaKey } from '../metadata';
import { Model } from '../model';
import { ObjectProcessor } from './object-processor';

export class OutputService {
    public static async output<T, Context>(rawValue: T, context: Context, model: Model<T>) {
        const defaultAppliedResult = await ObjectProcessor.setDefault<T, Context>({
            obj: this.lean(rawValue),
            context,
            modelDefinition: model.definition,
            MetaKey: MetaKey.DefaultOnOutput,
        });
        return await ObjectProcessor.transform<T, Context>({
            obj: defaultAppliedResult,
            context,
            modelDefinition: model.definition,
            MetaKey: MetaKey.TransformOnOutput,
        });
    }

    private static lean<T>(rawValue: T) {
        const leanValue = util.defaultTo((rawValue as any)['toObject']?.(), rawValue);
        if (util.isNil(leanValue.id) && util.isTruthy(leanValue._id)) {
            leanValue.id = leanValue._id.toString();
        }
        return leanValue;
    }
}
