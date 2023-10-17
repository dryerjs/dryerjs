import { ClassType } from './shared';
import * as util from './util';

const ObjectProcessedWithClass = Symbol('object_processed_with_class');

export class ObjectMarker {
    public static mark<T>(obj: T, classType: ClassType) {
        obj[ObjectProcessedWithClass] = classType;
        return obj;
    }

    /* istanbul ignore next */
    public static getClass<T>(obj: T) {
        return obj[ObjectProcessedWithClass];
    }

    public static isProcessed(obj: any) {
        return util.isFunction(obj[ObjectProcessedWithClass]);
    }
}
