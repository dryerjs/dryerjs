import * as util from './util';
import { MetaKey, Metadata } from './metadata';
import { Relation } from './shared';

export class Property {
    constructor(
        private modelDefinition: any,
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
        return util.isFunction(this.getMetaValue(MetaKey.Embedded));
    }

    public getEmbeddedModelDefinition() {
        const embeddedValue = this.getMetaValue(MetaKey.Embedded);

        if (util.isUndefined(embeddedValue)) {
            throw new Error(`Property ${this.name} is not an embedded property`);
        }

        // type can be class or a arrow function that returns a class
        const typeAsClass = embeddedValue.toString().includes('class');
        if (typeAsClass) return embeddedValue;
        return embeddedValue();
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
