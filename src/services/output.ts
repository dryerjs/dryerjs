import { Injectable } from 'injection-js';
import { MetaKey } from '../metadata';
import { Context } from '../dryer';
import { ObjectProcessor } from './object-processor';
import { ModelDefinition } from '../shared';
import { ObjectMarker } from '../object-marker';

@Injectable()
export class OutputService<T, ExtraContext> {
    constructor(private readonly objectProcessor: ObjectProcessor<T, ExtraContext>) {}

    public async output(rawValue: T, context: Context<ExtraContext>, modelDefinition: ModelDefinition) {
        const leanedObject = await this.objectProcessor.lean({
            obj: rawValue,
            modelDefinition,
        });
        const defaultAppliedResult = await this.objectProcessor.setDefault({
            obj: leanedObject,
            context,
            modelDefinition,
            metaKey: MetaKey.DefaultOnOutput,
        });
        const result = await this.objectProcessor.transform({
            obj: defaultAppliedResult,
            context,
            modelDefinition,
            metaKey: MetaKey.TransformOnOutput,
        });

        ObjectMarker.mark(result, modelDefinition);
        return result;
    }
}
