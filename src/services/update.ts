import * as graphql from 'graphql';
import * as util from '../util';
import { Model } from '../model';
import { MetaKey } from '../metadata';
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
            metaKey: MetaKey.DefaultOnUpdate,
        });
        const transformedInput = await ObjectProcessor.setDefault({
            obj: defaultAppliedInput,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.TransformOnUpdate,
        });
        const result = await model.db.findByIdAndUpdate(id, transformedInput, {
            new: true,
        });
        if (util.isNil(result)) {
            throw new graphql.GraphQLError(`No ${model.name} found with id ${id}`, {
                extensions: {
                    code: 'NOT_FOUND',
                    http: { status: 404 },
                },
            });
        }
        return await OutputService.output<T, Context>(result, context, model);
    }
}
