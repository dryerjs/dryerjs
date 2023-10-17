import { GraphQLString, GraphQLFloat, GraphQLBoolean, GraphQLEnumType } from 'graphql';
import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { ApiType, Argument, ClassType, EmbeddedSchemaOptions, FilterableOptions, Relation } from './shared';

const ENUM_CACHE_KEY = Symbol('enum_cache_key');

export class Property {
    constructor(
        public modelDefinition: any,
        public name: string,
        public designType: ClassType,
    ) {}

    public getMetaValue(key: MetaKey) {
        return Metadata.getMetaValue(this.modelDefinition, key, this.name);
    }

    public isArray() {
        return util.isFunction(this.designType) && this.designType.name === 'Array';
    }

    public isEmbedded() {
        return util.isObject(this.getMetaValue(MetaKey.Embedded));
    }

    public getEmbeddedModelDefinition() {
        const embeddedSchemaOptions = this.getMetaValue(MetaKey.Embedded) as EmbeddedSchemaOptions;

        if (util.isUndefined(embeddedSchemaOptions)) {
            throw new Error(`Property ${this.name} is not an embedded property`);
        }

        // type can be class or a arrow function that returns a class
        const typeAsClass = embeddedSchemaOptions.type.toString().includes('class');
        if (typeAsClass) return embeddedSchemaOptions.type;
        return embeddedSchemaOptions.type();
    }

    public isEmbeddedApiExcluded(apiType: ApiType) {
        const schemaOptions: EmbeddedSchemaOptions = this.getMetaValue(MetaKey.Embedded);
        return util.defaultTo(schemaOptions.excluded, []).includes(apiType);
    }

    public isRelation() {
        return util.isNotNullObject(this.getMetaValue(MetaKey.Relation));
    }

    public getRelation(): Relation {
        /* istanbul ignore if */
        if (!this.isRelation()) {
            throw new Error(`Property ${this.name} is not a relation property, check isRelation() before`);
        }

        return this.getMetaValue(MetaKey.Relation);
    }

    public getRelationModelDefinition() {
        const relationType = this.getRelation().type;
        // type can be class or a arrow function that returns a class
        const typeAsClass = relationType.toString().includes('class');
        if (typeAsClass) return relationType;
        return relationType();
    }

    public getFilterableOptions() {
        return this.getMetaValue(MetaKey.Filterable) as FilterableOptions;
    }

    public getScalarOrEnumType() {
        const overrideType = this.getMetaValue(MetaKey.GraphQLType);
        if (util.isObject(overrideType)) return overrideType;

        const typeConfig = {
            String: GraphQLString,
            Date: GraphQLString,
            Number: GraphQLFloat,
            Boolean: GraphQLBoolean,
        };

        if (util.isFunction(this.getMetaValue(MetaKey.ScalarArrayType))) {
            return typeConfig[this.getMetaValue(MetaKey.ScalarArrayType).name];
        }

        const enumInObject = this.getMetaValue(MetaKey.Enum);
        if (util.isObject(enumInObject)) {
            const enumName = Object.keys(enumInObject)[0];
            const enumValues = enumInObject[enumName];

            enumInObject[ENUM_CACHE_KEY] =
                enumInObject[ENUM_CACHE_KEY] ??
                new GraphQLEnumType({
                    name: enumName,
                    values: Object.keys(enumValues)
                        .filter(key => !'0123456789'.includes(key)) // support enum for numbers
                        .reduce((values, key) => {
                            values[key] = { value: enumValues[key] };
                            return values;
                        }, {}),
                });

            return enumInObject[ENUM_CACHE_KEY];
        }

        if (typeConfig[this.designType.name]) return typeConfig[this.designType.name];
        throw new Error(`Property ${this.name} is not a scalar property`);
    }

    public getArgs(): Argument[] {
        return this.getMetaValue(MetaKey.Arg);
    }
}
