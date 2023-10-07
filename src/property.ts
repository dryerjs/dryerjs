import * as util from './util';
import { MetaKey, Metadata } from './metadata';

export class Property {
    constructor(
        private modelDefinition: any,
        public name: string,
        public typeInClass: any,
    ) {}

    public getMetaValue(key: MetaKey) {
        return Metadata.getMetaValue(this.modelDefinition.name, key, this.name);
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

    public isArray() {
        return util.isFunction(this.typeInClass) && this.typeInClass.name === 'Array';
    }
}
