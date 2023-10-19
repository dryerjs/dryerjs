import { Injectable } from 'injection-js';
import { Model } from '../model';
import { Context } from '../dryer';
import * as must from './must';
import { inspect } from '../inspect';
import { RelationKind } from '../shared';

@Injectable()
export class DeleteService<T, ExtraContext> {
    public async delete(id: string, context: Context<ExtraContext>, model: Model<T>) {
        const deleteDoc = await model.db.findById(id);
        must.found(deleteDoc, model, id);

        await model.db.deleteOne({ _id: id });

        for (const property of inspect(model.definition).getRelationProperties()) {
            const relation = property.getRelation();
            const relationModel = context.dryer.model(property.getRelationModelDefinition());

            if (relation.kind === RelationKind.HasMany || relation.kind === RelationKind.HasOne) {
                const relationDocs = await relationModel.db.find<T>({ [relation.to]: id });
                await Promise.all(
                    relationDocs.map(doc => this.delete(doc['_id'], context, relationModel as any)),
                );
            }
        }
    }
}
