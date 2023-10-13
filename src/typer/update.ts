import { MetaKey } from '../metadata';
import { Property } from '../property';
import { BaseTypeBuilder } from './base';

export class UpdateInputTypeBuilder extends BaseTypeBuilder {
    protected getName() {
        return `Update${this.modelDefinition.name}Input`;
    }

    protected isExcluded(property: Property) {
        return property.getMetaValue(MetaKey.ExcludeOnUpdate);
    }

    protected isNullable(property: Property) {
        return !property.getMetaValue(MetaKey.RequiredOnUpdate);
    }

    protected useAs: 'input' | 'output' = 'input';
}
