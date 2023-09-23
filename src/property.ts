import 'reflect-metadata';

export function Property() {
    return function (target: any, propertyKey: string) {
        const propertyType = Reflect.getOwnMetadata('design:type', target, propertyKey);
        target[propertyKey] = propertyType;
    };
}
