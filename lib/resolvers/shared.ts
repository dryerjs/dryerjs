import { plainToInstance } from 'class-transformer';
import { ArgumentMetadata, mixin, PipeTransform, Type, ValidationPipe } from '@nestjs/common';

import * as util from '../util';
import { inspect } from '../inspect';
import { OutputType } from '../type-functions';
import { Definition } from '../definition';

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

export const appendIdAndTransform = (definition: Definition, item: any) => {
  const output = item['toObject']?.() || item;
  if (util.isNil(output.id) && util.isObject(output._id)) {
    output.id = output._id.toHexString();
  }

  for (const property of inspect(definition).embeddedProperties) {
    /* istanbul ignore if */
    if (util.isNil(output[property.name])) continue;
    const embeddedDefinition = property.getEmbeddedDefinition();
    // TODO: Write test for this case and remove "istanbul ignore else"
    /* istanbul ignore else */
    if (util.isArray(output[property.name])) {
      output[property.name] = output[property.name].map((subItem: any) => {
        return appendIdAndTransform(embeddedDefinition, subItem);
      });
    } else {
      output[property.name] = appendIdAndTransform(embeddedDefinition, output[property.name]);
    }
  }

  return plainToInstance(OutputType(definition), output);
};
