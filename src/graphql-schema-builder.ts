import {
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLEnumType,
} from 'graphql';
import { AnyClass, ModelDefinition } from './type';
import { CachedPropertiesByModel, MetadataKey } from './metadata';

const enumTypeCached = {};

class TraversedProperty {
    constructor(
        private modelDefinition: ModelDefinition,
        public name: string,
        public typeInClass: AnyClass,
    ) {}

    public getMetadataValue(key: MetadataKey) {
        return CachedPropertiesByModel.getMetadataValue(this.modelDefinition.name, key, this.name);
    }
}

abstract class BaseTypeBuilder {
    constructor(protected modelDefinition: ModelDefinition) {}

    private traverse(fn: (property: TraversedProperty) => void) {
        const instance = new this.modelDefinition();
        for (const property in CachedPropertiesByModel.getPropertiesByModel(
            this.modelDefinition.name,
            MetadataKey.DesignType,
        )) {
            const typeInClass = Reflect.getMetadata(MetadataKey.DesignType, instance, property);
            const traversedProperty = new TraversedProperty(this.modelDefinition, property, typeInClass);
            fn(traversedProperty);
        }
    }

    protected abstract getName(): string;
    protected abstract isExcludedField(traversedProperty: TraversedProperty): boolean;
    protected abstract isNullableField(traversedProperty: TraversedProperty): boolean;
    protected abstract useAs: 'input' | 'output';

    public getType() {
        const result = {
            name: this.getName(),
            fields: {},
        };

        this.traverse(traversedProperty => {
            if (this.isExcludedField(traversedProperty)) return;
            const isNullable = this.isNullableField(traversedProperty);
            const type = this.getTypeForOneField(traversedProperty, isNullable);
            if (!type) return;

            result.fields[traversedProperty.name] = { type };
        });

        if (this.useAs === 'input') return new GraphQLInputObjectType(result);
        if (this.useAs === 'output') return new GraphQLObjectType(result);
        /* istanbul ignore next */
        throw new Error('Invalid useAs');
    }

    private getTypeForOneField(traversedProperty: TraversedProperty, nullable: boolean) {
        const baseType = this.getBaseTypeForField(traversedProperty);
        return nullable ? baseType : new GraphQLNonNull(baseType);
    }

    private getBaseTypeForField(traversedProperty: TraversedProperty) {
        const overrideType = traversedProperty.getMetadataValue(MetadataKey.GraphQLType);
        if (overrideType) return overrideType;

        const typeConfig = {
            String: GraphQLString,
            Date: GraphQLString,
            Number: GraphQLFloat,
            Boolean: GraphQLBoolean,
        };
        const enumInObject = traversedProperty.getMetadataValue(MetadataKey.Enum);
        if (enumInObject) {
            const enumName = Object.keys(enumInObject)[0];
            const enumValues = enumInObject[enumName];

            enumTypeCached[enumName] =
                enumTypeCached[enumName] ??
                new GraphQLEnumType({
                    name: enumName,
                    values: Object.keys(enumValues).reduce((values, key) => {
                        values[key] = { value: enumValues[key] };
                        return values;
                    }, {}),
                });

            return enumTypeCached[enumName];
        }

        const scalarBaseType = typeConfig[traversedProperty.typeInClass.name];
        if (scalarBaseType) return scalarBaseType;

        const isEmbedded = traversedProperty.getMetadataValue(MetadataKey.Embedded);
        if (isEmbedded) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new this.constructor(traversedProperty.typeInClass).getType();
        }

        throw new Error(
            `Invalid type for field ${traversedProperty.name}. You can override it with @GraphQLType(/* type */)`,
        );
    }
}

class OutputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return this.modelDefinition.name;
    }

    protected isExcludedField(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetadataValue(MetadataKey.ExcludeOnOutput);
    }

    protected isNullableField(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetadataValue(MetadataKey.NullableOnOutput);
    }

    protected useAs: 'input' | 'output' = 'output';
}

class CreateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Create${this.modelDefinition.name}Input`;
    }

    protected isExcludedField(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetadataValue(MetadataKey.ExcludeOnCreate);
    }

    protected isNullableField(traversedProperty: TraversedProperty) {
        return !traversedProperty.getMetadataValue(MetadataKey.RequiredOnCreate);
    }

    protected useAs: 'input' | 'output' = 'input';
}

class UpdateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Update${this.modelDefinition.name}Input`;
    }

    protected isExcludedField(traversedProperty: TraversedProperty) {
        return traversedProperty.getMetadataValue(MetadataKey.ExcludeOnUpdate);
    }

    protected isNullableField(traversedProperty: TraversedProperty) {
        return !traversedProperty.getMetadataValue(MetadataKey.RequiredOnUpdate);
    }

    protected useAs: 'input' | 'output' = 'input';
}

export class GraphqlTypeBuilder {
    static build(modelDefinition: ModelDefinition) {
        const output = new OutputTypeBuilder(modelDefinition).getType() as GraphQLObjectType;
        const create = new CreateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        const update = new UpdateInputTypeBuilder(modelDefinition).getType() as GraphQLInputObjectType;
        return {
            output,
            nonNullOutput: new GraphQLNonNull(output),
            create,
            update,
        };
    }
}
