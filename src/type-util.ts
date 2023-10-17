import { inspect } from './inspect';
import { MetaKey, Metadata } from './metadata';

type Constructor<T extends object, Arguments extends unknown[] = any[]> = new (...arguments_: Arguments) => T;

type BaseClassType<T extends object = object, Arguments extends unknown[] = any[]> = Constructor<
    T,
    Arguments
> & {
    prototype: T;
};

export function Pick<T extends BaseClassType, K extends keyof InstanceType<T>>(
    BaseClass: T,
    names: K[],
    inputInheritMode: 'create' | 'update' = 'create',
): BaseClassType<Pick<InstanceType<T>, K>> {
    class ChildClass {}
    const baseProperties = inspect(BaseClass).getProperties();
    for (const name of names as string[]) {
        Metadata.copyProperty(BaseClass, ChildClass, name as string);
        const baseProperty = baseProperties.find(prop => prop.name === name)!;
        Reflect.defineMetadata(MetaKey.DesignType, baseProperty.designType, ChildClass.prototype, name);
        Metadata.setModelProperty(ChildClass, MetaKey.InputTypeInheritMode, inputInheritMode);
    }
    return ChildClass as any;
}

export function Omit<T extends BaseClassType, K extends keyof InstanceType<T>>(
    BaseClass: T,
    names: K[],
    inputInheritMode: 'create' | 'update' = 'create',
): BaseClassType<Omit<InstanceType<T>, K>> {
    class ChildClass {}
    const baseProperties = inspect(BaseClass).getProperties();
    for (const baseProperty of baseProperties) {
        if ((names as string[]).includes(baseProperty.name)) continue;
        Metadata.copyProperty(BaseClass, ChildClass, baseProperty.name);
        Reflect.defineMetadata(
            MetaKey.DesignType,
            baseProperty.designType,
            ChildClass.prototype,
            baseProperty.name,
        );
    }
    Metadata.setModelProperty(ChildClass, MetaKey.InputTypeInheritMode, inputInheritMode);
    return ChildClass as any;
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export function Partial<T extends BaseClassType, K extends keyof InstanceType<T> = keyof InstanceType<T>>(
    BaseClass: T,
    names?: Record<K, 1> | null,
    inputInheritMode: 'create' | 'update' = 'create',
): BaseClassType<PartialBy<InstanceType<T>, K>> {
    class ChildClass {}
    const baseProperties = inspect(BaseClass).getProperties();
    for (const baseProperty of baseProperties) {
        if ((names as string[]).includes(baseProperty.name)) continue;
        Metadata.copyProperty(BaseClass, ChildClass, baseProperty.name);
        Metadata.setProperty(ChildClass, MetaKey.NullableOnOutput, baseProperty.name);
        Metadata.unsetProperty(ChildClass, MetaKey.RequiredOnCreate, baseProperty.name);
        Metadata.unsetProperty(ChildClass, MetaKey.RequiredOnUpdate, baseProperty.name);
    }
    Metadata.setModelProperty(ChildClass, MetaKey.InputTypeInheritMode, inputInheritMode);
    return ChildClass as any;
}

type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export function Required<T extends BaseClassType, K extends keyof InstanceType<T> = keyof InstanceType<T>>(
    BaseClass: T,
    names?: Record<K, 1> | null,
    inputInheritMode: 'create' | 'update' = 'create',
): BaseClassType<RequiredBy<InstanceType<T>, K>> {
    class ChildClass {}
    const baseProperties = inspect(BaseClass).getProperties();
    for (const baseProperty of baseProperties) {
        if ((names as string[]).includes(baseProperty.name)) continue;
        Metadata.copyProperty(BaseClass, ChildClass, baseProperty.name);
        Metadata.setProperty(ChildClass, MetaKey.NullableOnOutput, baseProperty.name);
        Metadata.unsetProperty(ChildClass, MetaKey.RequiredOnCreate, baseProperty.name);
        Metadata.unsetProperty(ChildClass, MetaKey.RequiredOnUpdate, baseProperty.name);
    }
    Metadata.setModelProperty(ChildClass, MetaKey.InputTypeInheritMode, inputInheritMode);
    return ChildClass as any;
}
