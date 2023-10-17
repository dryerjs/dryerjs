import { Model } from '../model';
import { BaseContext } from '../dryer';
import * as must from './must';
import { inspect } from '../inspect';
import { RelationKind } from '../shared';

export class DeleteService {
    public static async delete<T, Context extends BaseContext>(
        id: string,
        _context: Context,
        model: Model<T>,
    ) {
        const deleteDoc = await model.db.findById(id);
        must.found(deleteDoc, model, id);

        await model.db.deleteOne({ _id: id });

        for (const property of inspect(model.definition).getRelationProperties()) {
            const relation = property.getRelation();
            const relationModel = _context.dryer.model(property.getRelationModelDefinition());

            if (relation.kind === RelationKind.HasMany || relation.kind === RelationKind.HasOne) {
                const relationDocs = await relationModel.db.find<T>({ [relation.to]: id });
                await Promise.all(relationDocs.map(doc => this.delete(doc['_id'], _context, relationModel)));
            }
        }
    }
}
