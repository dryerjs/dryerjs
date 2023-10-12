import { GraphQLList } from 'graphql';
import { RelationKind } from '../shared';
import { MetaKey } from '../metadata';
import { Property } from '../property';
import { BaseTypeBuilder } from './base';
import { Typer } from './typer';

export class CreateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Create${this.modelDefinition.name}Input`;
    }

    protected isExcluded(property: Property) {
        return property.getMetaValue(MetaKey.ExcludeOnCreate);
    }

    protected isNullable(property: Property) {
        return !property.getMetaValue(MetaKey.RequiredOnCreate);
    }

    protected getPropertyBaseType(property: Property) {
        if (!property.isRelation()) return super.getPropertyBaseType(property);
        if (property.getRelation().kind === RelationKind.ReferencesMany) {
            return new GraphQLList(Typer.get(property.getRelationModelDefinition()).create);
        }
        if (
            property.getRelation().kind === RelationKind.HasMany ||
            property.getRelation().kind === RelationKind.HasOne
        ) {
            const subType = Typer.getCreateInputForBelongingModel(
                property.getRelationModelDefinition(),
                property,
            );
            return property.isArray() ? new GraphQLList(subType) : subType;
        }
        /* istanbul ignore next */
        throw new Error(`Invalid relation kind ${property.getRelation().kind}`);
    }
    protected useAs: 'input' | 'output' = 'input';
}
