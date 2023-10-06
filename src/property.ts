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

    public getEmbeddedModelDefinition() {
        const result = this.getMetaValue(MetaKey.Embedded);
        if (util.isUndefined(result)) {
            throw new Error(`Property ${this.name} is not an embedded property`);
        }
        return result;
    }

    public isArray() {
        return util.isFunction(this.typeInClass) && this.typeInClass.name === 'Array';
    }
}
