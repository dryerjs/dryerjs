import { inspect } from './inspect';
import { MetaKey, Metadata } from './metadata';

export type Constructor<T extends object, Arguments extends unknown[] = any[]> = new (
    ...arguments_: Arguments
) => T;

export type ClassType<T extends object = object, Arguments extends unknown[] = any[]> = Constructor<
    T,
    Arguments
> & {
    prototype: T;
};

export function buildType(BaseClass: ClassType, names: Record<string, 1>): any {
    class ChildClass {}
    const baseProps = inspect(BaseClass).getProperties();
    for (const name of Object.keys(names)) {
        Metadata.copyProperty(BaseClass, ChildClass, name);
        const baseProp = baseProps.find(prop => prop.name === name)!;
        Metadata.addProperty(ChildClass, MetaKey.InheritedDesignType, name, baseProp.designType);
    }
    return ChildClass;
}

export function Pick<T extends ClassType, K extends keyof InstanceType<T>>(
    BaseClass: T,
    names: Record<K, 1>,
): ClassType<Pick<InstanceType<T>, K>> {
    return buildType(BaseClass, names);
}

export function Omit<T extends ClassType, K extends keyof InstanceType<T>>(
    BaseClass: T,
    names: Record<K, 1>,
): ClassType<Omit<InstanceType<T>, K>> {
    return buildType(BaseClass, names);
}

// type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
// export function Partial<T extends ClassType, K extends keyof InstanceType<T> = keyof InstanceType<T>>(
//     BaseClass: T,
//     names?: Record<K, 1> | null,
// ): ClassType<PartialBy<InstanceType<T>, K>> {
//     return buildType(BaseClass, names);

// }

// export function Required<T extends ClassType, K extends keyof InstanceType<T> = keyof InstanceType<T>>(
//     BaseClass: T,
//     names?: Record<K, 1> | null,
// ): ClassType<RequiredBy<InstanceType<T>, K>> {
//     return buildType(BaseClass, names);

// }
