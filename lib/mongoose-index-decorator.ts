import { IndexDefinition, IndexOptions } from 'mongoose';
import { MetaKey, Metadata } from './metadata';
import * as util from './util';

export function Index(fields: IndexDefinition, options?: IndexOptions) {
  return function (target: object) {
    const currentIndices = Metadata.for(target).get(MetaKey.Index);
    Metadata.for(target).set(MetaKey.Index, [{ fields, options }, ...util.defaultTo(currentIndices, [])]);
  };
}
