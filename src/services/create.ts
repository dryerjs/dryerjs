import { Injectable } from 'injection-js';
import { MetaKey } from '../metadata';
import { Model } from '../model';
import { inspect } from '../inspect';
import * as util from '../util';
import * as must from './must';
import { Context } from '../dryer';

import { OutputService } from './output';
import { ObjectProcessor } from './object-processor';
import { RelationKind } from '../shared';
import { UpdateService } from './update';
import { GetService } from './get';

@Injectable()
export class CreateService<T, ExtraContext> {
    constructor(
        private readonly objectProcessor: ObjectProcessor<T, ExtraContext>,
        private readonly outputService: OutputService<T, ExtraContext>,
        private readonly getService: GetService<T, ExtraContext>,
        private readonly updateService: UpdateService<T, ExtraContext>,
    ) {}

    public async create(input: Partial<T>, context: Context<ExtraContext>, model: Model<T>) {
        await this.objectProcessor.validate({ input, context, modelDefinition: model.definition });
        const defaultAppliedInput = await this.objectProcessor.setDefaultPartial({
            obj: input,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.DefaultOnCreate,
        });
        const transformedInput = await this.objectProcessor.transformPartial({
            obj: defaultAppliedInput,
            context,
            modelDefinition: model.definition,
            metaKey: MetaKey.TransformOnCreate,
        });

        for (const property of inspect(model.definition).getRelationProperties()) {
            const relation = property.getRelation();
            const relationModel = context.dryer.model(property.getRelationModelDefinition());
            if (relation.kind === RelationKind.BelongsTo) {
                must.found(
                    await relationModel.db.exists({ _id: input[relation.from] }),
                    relationModel,
                    input[relation.from],
                );
                continue;
            }
        }

        const value = await model.db.create(transformedInput);
        return await this.outputService.output(value, context, model.definition);
    }

    public async createRecursive(input: Partial<T>, context: Context<ExtraContext>, model: Model<T>) {
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
                    await this.createRecursive(
                        { ...relatedInputItem, [relation.to]: result['_id'] },
                        context,
                        relationModel as any,
                    );
                }
            }

            if (relation.kind === RelationKind.HasOne) {
                await this.createRecursive(
                    { ...relatedInput, [relation.to]: result['_id'] },
                    context,
                    relationModel as any,
                );
                return result;
            }

            if (relation.kind === RelationKind.ReferencesMany) {
                const ids: string[] = [];
                for (const relatedInputItem of relatedInput as any[]) {
                    const { id } = (await this.createRecursive(
                        relatedInputItem,
                        context,
                        relationModel as any,
                    )) as any;
                    ids.push(id);
                }
                await this.updateService.update(
                    result['_id'],
                    { [relation.from]: [...result[relation.from], ...ids] } as any,
                    context,
                    model,
                );
            }
        }

        return await this.getService.getOrThrow(result['_id'], context, model);
    }
}
