import { GraphQLList } from 'graphql';
import { RelationKind } from '../shared';
import { MetaKey } from '../metadata';
import { Property } from '../property';
import { BaseContext } from '../dryer';
import { BaseTypeBuilder } from './base';
import { Typer } from './typer';

export class OutputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return this.modelDefinition.name;
    }

    protected isExcluded(property: Property) {
        return property.getMetaValue(MetaKey.ExcludeOnOutput);
    }

    protected isNullable(property: Property) {
        return property.getMetaValue(MetaKey.NullableOnOutput);
    }

    protected getPropertyBaseType(property: Property) {
        if (!property.isRelation()) return super.getPropertyBaseType(property);
        if (property.getRelation().kind === RelationKind.BelongsTo) {
            const resolve = (parent: any, _args: any, context: BaseContext) => {
                const filter = { [property.getRelation().to]: parent[property.getRelation().from] };
                return context.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getOne(filter);
            };

            return {
                get type() {
                    return Typer.get(property.getRelationModelDefinition()).output;
                },
                resolve,
            };
        }

        if (property.getRelation().kind === RelationKind.HasMany) {
            const resolve = async (parent: any, _args: any, context: BaseContext) => {
                const filter = { [property.getRelation().to]: parent[property.getRelation().from] };
                return await context.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getAll(filter);
            };
            return {
                get type() {
                    return new GraphQLList(Typer.get(property.getRelationModelDefinition()).output);
                },
                resolve,
            };
        }

        if (property.getRelation().kind === RelationKind.HasOne) {
            const resolve = async (_parent: any, _args: any, context: BaseContext) => {
                const filter = { [property.getRelation().to]: _parent[property.getRelation().from] };
                const [result] = await context.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getAll(filter);

                return result;
            };
            return {
                get type() {
                    return Typer.get(property.getRelationModelDefinition()).output;
                },
                resolve,
            };
        }
        if (property.getRelation().kind === RelationKind.ReferencesMany) {
            const resolve = async (parent: any, _args: any, context: BaseContext) => {
                const filter = { [property.getRelation().to]: { $in: parent[property.getRelation().from] } };
                return await context.dryer
                    .model(property.getRelationModelDefinition())
                    .inContext(context)
                    .getAll(filter);
            };
            return {
                get type() {
                    return new GraphQLList(Typer.get(property.getRelationModelDefinition()).output);
                },
                resolve,
            };
        }
        /* istanbul ignore next */
        throw new Error(`Invalid relation kind ${property.getRelation().kind}`);
    }

    protected useAs: 'input' | 'output' = 'output';
}
