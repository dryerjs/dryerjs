import * as util from '../util';
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
        const defaultAppliedResult = await ObjectProcessor.setDefault<T, Context>({
            obj: this.lean(rawValue),
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

    private static lean<T>(rawValue: any): T {
        if (util.isNil(rawValue.id) && util.isTruthy(rawValue._id)) {
            rawValue.id = rawValue._id.toString();
        }
        return rawValue;
    }
}
