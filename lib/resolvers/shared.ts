import { plainToInstance } from 'class-transformer';

import * as util from '../util';
import { Definition } from '../shared';
import { Typer } from '../typer';
import { inspect } from '../inspect';

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

  return plainToInstance(Typer(definition).output, output);
};
