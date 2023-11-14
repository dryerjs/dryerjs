import { ArgumentMetadata, mixin, PipeTransform, Type, ValidationPipe } from '@nestjs/common';
import * as util from '../util';

// https://github.com/nestjs/nest/issues/803#issuecomment-499088608
export const ArrayValidationPipe: <T>(itemType: Type<T>) => Type<PipeTransform> =
  function createArrayValidationPipe<T>(itemType: Type<T>): Type<PipeTransform> {
    class MixinArrayValidationPipe extends ValidationPipe implements PipeTransform {
      constructor() {
        super({ transform: true, expectedType: itemType });
      }

      transform(values: T[], metadata: ArgumentMetadata): Promise<any[]> {
        /* istanbul ignore if */
        if (!Array.isArray(values)) {
          return values;
        }
        return Promise.all(
          values.map((value) => super.transform(value, { ...metadata, metatype: itemType })),
        );
      }
    }

    return mixin(MixinArrayValidationPipe);
  };

const Noop: MethodDecorator = function (
  _target: any,
  _propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  return descriptor;
};

export const applyDecorators = (decorators: MethodDecorator | MethodDecorator[] | undefined | null) => {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const normalizedDecorators = (
      util.isArray(decorators) ? decorators : [util.defaultTo(decorators, Noop)]
    ) as MethodDecorator[];
    for (const normalizedDecorator of normalizedDecorators) {
      normalizedDecorator(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};
