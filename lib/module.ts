import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';

import * as util from './util';
import { defaultContextDecorator } from './context';
import * as mongoosePaginateV2 from './js/mongoose-paginate-v2';

import {
  createResolver,
  createResolverForEmbedded,
  createResolverForReferencesMany,
  createResolverForBelongsTo,
  createResolverForHasMany,
  createResolverForHasOne,
} from './resolvers';
import { inspect } from './inspect';
import { createBaseService, getBaseServiceToken } from './base.service';
import { DefaultHook } from './default.hook';
import { MetaKey, Metadata } from './metadata';
import { DryerModuleOptions, DryerModuleOptionsSymbol } from './module-options';

@Module({})
export class DryerModule {
  public static MongooseModuleForFeatureModule: DynamicModule;

  public static register(input: DryerModuleOptions): DynamicModule {
    const contextDecorator = util.defaultTo(input.contextDecorator, defaultContextDecorator);
    const providers: Provider[] = [];
    input.definitions.forEach((definition) => providers.push(createResolver(definition, contextDecorator)));
    input.definitions.forEach((definition) => {
      for (const property of inspect(definition).embeddedProperties) {
        if (Reflect.getMetadata('design:type', definition.prototype, property.name) === Array) {
          providers.push(createResolverForEmbedded(definition, property.name, contextDecorator));
        }
      }
      for (const property of inspect(definition).referencesManyProperties) {
        providers.push(createResolverForReferencesMany(definition, property.name, contextDecorator));
      }
      for (const property of inspect(definition).hasManyProperties) {
        providers.push(createResolverForHasMany(definition, property.name, contextDecorator));
      }
      for (const property of inspect(definition).belongsToProperties) {
        providers.push(createResolverForBelongsTo(definition, property.name, contextDecorator));
      }
      for (const property of inspect(definition).hasOneProperties) {
        providers.push(createResolverForHasOne(definition, property.name, contextDecorator));
      }
    });
    const mongooseForFeatureModule = MongooseModule.forFeature(
      input.definitions.map((definition) => {
        const schema = SchemaFactory.createForClass(definition);
        schema.plugin(mongoosePaginateV2);
        schema.virtual('id').get(function () {
          return (this['_id'] as any).toHexString();
        });
        const indexes = Metadata.for(definition).get(MetaKey.Index);
        for (const { fields, options } of util.defaultTo(indexes, [])) schema.index(fields, options);
        input.onSchema?.(schema, definition);
        return {
          name: definition.name,
          schema,
        };
      }),
    );

    const mongooseModuleExports = mongooseForFeatureModule.exports as any;
    const hooks = [DefaultHook as Provider].concat(util.defaultTo(input.hooks, []));
    const baseServicesProviders = input.definitions.map((definition) => ({
      provide: getBaseServiceToken(definition),
      useClass: createBaseService(definition, hooks),
    }));
    return {
      module: DryerModule,
      providers: [
        ...providers,
        ...mongooseModuleExports,
        ...baseServicesProviders,
        ...hooks,
        { useValue: input, provide: DryerModuleOptionsSymbol },
      ],
      exports: [...mongooseModuleExports, ...baseServicesProviders],
    };
  }
}
