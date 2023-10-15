import { inspect } from './inspect';
import { MetaKey, Metadata } from './metadata';

type Constructor<T extends object, Arguments extends unknown[] = any[]> = new (...arguments_: Arguments) => T;

type BaseClassType<T extends object = object, Arguments extends unknown[] = any[]> = Constructor<
    T,
    Arguments
> & {
    prototype: T;
};

export function buildType(BaseClass: BaseClassType, names: string[]): any {
    class ChildClass {}
    const baseProps = inspect(BaseClass).getProperties();
    for (const name of names) {
        Metadata.copyProperty(BaseClass, ChildClass, name);
        const baseProp = baseProps.find(prop => prop.name === name)!;
        Reflect.defineMetadata(MetaKey.DesignType, baseProp.designType, ChildClass.prototype, name);
    }
    return ChildClass;
}

export function Pick<T extends BaseClassType, K extends keyof InstanceType<T>>(
    BaseClass: T,
    names: K[],
): BaseClassType<Pick<InstanceType<T>, K>> {
    return buildType(BaseClass, names as string[]);
}

export function Omit<T extends BaseClassType, K extends keyof InstanceType<T>>(
    BaseClass: T,
    names: K[],
): BaseClassType<Omit<InstanceType<T>, K>> {
    return buildType(BaseClass, names as string[]);
}

// type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
// export function Partial<T extends BaseClassType, K extends keyof InstanceType<T> = keyof InstanceType<T>>(
//     BaseClass: T,
//     names?: Record<K, 1> | null,
// ): BaseClassType<PartialBy<InstanceType<T>, K>> {
//     return buildType(BaseClass, names);

// }

// export function Required<T extends BaseClassType, K extends keyof InstanceType<T> = keyof InstanceType<T>>(
//     BaseClass: T,
//     names?: Record<K, 1> | null,
// ): BaseClassType<RequiredBy<InstanceType<T>, K>> {
//     return buildType(BaseClass, names);

// }
