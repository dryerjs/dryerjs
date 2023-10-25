import { plainToInstance } from 'class-transformer';

import * as util from '../util';
import { Definition } from '../shared';
import { Typer } from '../typer';
import { MetaKey, Metadata } from '../metadata';

export const appendIdAndTransform = (definition: Definition, item: any) => {
  const output = item['toObject']?.() || item;
  if (util.isNil(output.id) && util.isObject(output._id)) {
    output.id = output._id.toHexString();
  }

  for (const propertyName in Metadata.getPropertiesByModel(definition, MetaKey.EmbeddedType)) {
    /* istanbul ignore if */
    if (util.isNil(output[propertyName])) continue;
    const embeddedDefinition = Metadata.getPropertiesByModel(definition, MetaKey.EmbeddedType)[
      propertyName
    ]();
    if (util.isArray(output[propertyName])) {
      output[propertyName] = output[propertyName].map((subItem: any) =>
        appendIdAndTransform(embeddedDefinition, subItem),
      );
    }
    output[propertyName] = appendIdAndTransform(embeddedDefinition, output[propertyName]);
  }

  return plainToInstance(Typer.getObjectType(definition), output);
};
