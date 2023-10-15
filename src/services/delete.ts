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
        const deleted = await model.db.findByIdAndDelete(id);
        must.found(deleted, model, id);

        for (const property of inspect(model.definition).getRelationProperties()) {
            const relation = property.getRelation();
            if (relation.kind === RelationKind.HasMany) {
                const relationModel = _context.dryer.model(property.getRelationModelDefinition());
                await relationModel.db.deleteMany({ [relation.to]: id });
            }
        }
    }
}
