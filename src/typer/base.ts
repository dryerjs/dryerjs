import {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLList,
} from 'graphql';
import * as util from '../util';
import { ModelDefinition } from '../shared';
import { MetaKey } from '../metadata';
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
        const overrideType = property.getMetaValue(MetaKey.GraphQLType);
        if (util.isObject(overrideType)) return overrideType;

        const typeConfig = {
            String: GraphQLString,
            Date: GraphQLString,
            Number: GraphQLFloat,
            Boolean: GraphQLBoolean,
        };

        const isScalarArrayType =
            property.isArray() && util.isFunction(property.getMetaValue(MetaKey.ScalarArrayType));
        if (isScalarArrayType) {
            return new GraphQLList(typeConfig[property.getMetaValue(MetaKey.ScalarArrayType).name]);
        }

        const enumInObject = property.getMetaValue(MetaKey.Enum);
        if (util.isObject(enumInObject)) {
            const cacheKey = '__graphql_enum_type__';
            const enumName = Object.keys(enumInObject)[0];
            const enumValues = enumInObject[enumName];

            enumInObject[cacheKey] =
                enumInObject[cacheKey] ??
                new GraphQLEnumType({
                    name: enumName,
                    values: Object.keys(enumValues)
                        .filter(key => !'0123456789'.includes(key)) // support enum for numbers
                        .reduce((values, key) => {
                            values[key] = { value: enumValues[key] };
                            return values;
                        }, {}),
                });

            return property.isArray() ? new GraphQLList(enumInObject[cacheKey]) : enumInObject[cacheKey];
        }

        if (property.isScalar()) return typeConfig[property.typeInClass.name];

        if (property.isEmbedded()) {
            const { create, update, output } = Typer.get(property.getEmbeddedModelDefinition());
            const subType = (() => {
                if (this.useAs === 'output') return output;
                if (this.useAs === 'input' && this.getName().startsWith('Create')) return create;
                return update;
            })();
            return property.isArray() ? new GraphQLList(subType) : subType;
        }

        throw new Error(
            `Invalid type for property ${property.name} for ${this.modelDefinition.name}. You can override it with @GraphQLType(/* type */)`,
        );
    }
}
