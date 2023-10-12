import { MetaKey } from '../metadata';
import { Model } from '../model';
import { inspect } from '../inspect';
import * as util from '../util';
import { BaseContext } from '../dryer';

import { OutputService } from './output';
import { ObjectProcessor } from './object-processor';
import { RelationKind } from '../shared';
import { UpdateService } from './update';
import { GetService } from './get';

export class CreateService {
    public static async create<T, Context extends BaseContext>(
        input: Partial<T>,
        context: Context,
        model: Model<T>,
    ) {
        await ObjectProcessor.validate({ input, context, modelDefinition: model.definition });
        const defaultAppliedInput = await ObjectProcessor.setDefaultPartial({
            obj: input,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.DefaultOnCreate,
        });
        const transformedInput = await ObjectProcessor.transform({
            obj: defaultAppliedInput,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.TransformOnCreate,
        });
        const value = await model.db.create(transformedInput);
        return await OutputService.output<T, Context>(value, context, model);
    }

    public static async createRecursive<T, Context extends BaseContext>(
        input: Partial<T>,
        context: Context,
        model: Model<T>,
    ) {
        const result = await this.create(input, context, model);

        for (const property of inspect(model.definition).getRelationProperties()) {
            const relation = property.getRelation();
            const supportedKinds = [RelationKind.HasMany, RelationKind.HasOne, RelationKind.ReferencesMany];
            if (!supportedKinds.includes(relation.kind)) continue;
            if (util.isNil(input[property.name])) continue;
            const relatedInput = input[property.name];
            const relationModel = context.dryer.model(property.getRelationModelDefinition());

            if (relation.kind === RelationKind.HasMany) {
                for (const relatedInputItem of relatedInput as any[]) {
                    await CreateService.createRecursive(
                        { ...relatedInputItem, [relation.to]: result['_id'] },
                        context,
                        relationModel,
                    );
                }
            }

            if (relation.kind === RelationKind.HasOne) {
                await CreateService.createRecursive(
                    { ...relatedInput, [relation.to]: result['_id'] },
                    context,
                    relationModel,
                );
                return result;
            }

            if (relation.kind === RelationKind.ReferencesMany) {
                const ids: string[] = [];
                for (const relatedInputItem of relatedInput as any[]) {
                    const { id } = (await CreateService.createRecursive(
                        relatedInputItem,
                        context,
                        relationModel,
                    )) as any;
                    ids.push(id);
                }
                await UpdateService.update(
                    result['_id'],
                    { [relation.from]: [...result[relation.from], ...ids] } as any,
                    context,
                    model,
                );
            }
        }
        return await GetService.getOrThrow<T, Context>(result['_id'], context, model);
    }
}
