import { ArgumentMetadata, mixin, PipeTransform, Type, ValidationPipe } from '@nestjs/common';

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
