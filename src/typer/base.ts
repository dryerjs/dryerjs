import { GraphQLObjectType, GraphQLInputObjectType, GraphQLNonNull, GraphQLList } from 'graphql';
import { ModelDefinition } from '../shared';
import { Property } from '../property';
import { inspect } from '../inspect';
import { Typer } from '.';

export abstract class BaseTypeBuilder {
    constructor(protected modelDefinition: ModelDefinition) {}

    protected abstract getName(): string;
    protected abstract isExcluded(property: Property): boolean;
    protected abstract isNullable(property: Property): boolean;
    protected abstract useAs: 'input' | 'output';

    public getType() {
        const result = {
            name: this.getName(),
            fields: {},
        };

        inspect(this.modelDefinition)
            .getProperties()
            .forEach(property => {
                if (this.isExcluded(property)) return;
                const isNullable = this.isNullable(property);
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const that = this;
                const propertyType = this.getPropertyType(property, isNullable);
                result.fields[property.name] = propertyType?.resolve
                    ? propertyType
                    : {
                          get type() {
                              return that.getPropertyType(property, isNullable);
                          },
                      };
            });

        if (this.useAs === 'input') return new GraphQLInputObjectType(result);
        if (this.useAs === 'output') return new GraphQLObjectType(result);
        /* istanbul ignore next */
        throw new Error('Invalid useAs');
    }

    private getPropertyType(property: Property, nullable: boolean) {
        const baseType = this.getPropertyBaseType(property);
        return nullable ? baseType : new GraphQLNonNull(baseType);
    }

    protected getPropertyBaseType(property: Property) {
        if (property.isEmbedded()) {
            const { create, update, output } = Typer.get(property.getEmbeddedModelDefinition());
            const subType = (() => {
                if (this.useAs === 'output') return output;
                if (this.useAs === 'input' && this.getName().startsWith('Create')) return create;
                return update;
            })();
            return property.isArray() ? new GraphQLList(subType) : subType;
        }
        const scalarOrEnumType = property.getScalarOrEnumType();
        return property.isArray() ? new GraphQLList(scalarOrEnumType) : scalarOrEnumType;
    }
}
