import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { ApiType, EmbeddedSchemaOptions, Relation } from './shared';

export class Property {
    constructor(
        public modelDefinition: any,
        public name: string,
        public typeInClass: any,
    ) {}

    public getMetaValue(key: MetaKey) {
        return Metadata.getMetaValue(this.modelDefinition.name, key, this.name);
    }

    public isScalar() {
        const typeConfig = {
            String,
            Date,
            Number,
            Boolean,
        };
        return util.isFunction(typeConfig[this.typeInClass.name]);
    }

    public isArray() {
        return util.isFunction(this.typeInClass) && this.typeInClass.name === 'Array';
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
        return util.defaultTo(schemaOptions.exclusion, []).includes(apiType);
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
}
