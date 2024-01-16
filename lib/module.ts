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
import {
  DryerModuleOptions,
  DRYER_MODULE_OPTIONS,
  DefinitionWithConfig,
  DRYER_DEFINITIONS,
} from './module-options';
import { Definition } from './definition';

@Module({})
export class DryerModule {
  public static MongooseModuleForFeatureModule: DynamicModule;

  public static register(input: DryerModuleOptions): DynamicModule {
    const contextDecorator = util.defaultTo(input.contextDecorator, defaultContextDecorator);
    const providers: Provider[] = [];
    input.definitions.forEach((definitionOrDefinitionConfig) => {
      const definitionWithConfig: DefinitionWithConfig = util.isFunction(definitionOrDefinitionConfig)
        ? {
            definition: definitionOrDefinitionConfig as Definition,
          }
        : (definitionOrDefinitionConfig as DefinitionWithConfig);

      const definition = definitionWithConfig.definition;

      providers.push(createResolver(definitionWithConfig, contextDecorator));

      for (const property of inspect(definition).embeddedProperties) {
        if (Reflect.getMetadata('design:type', definition.prototype, property.name) === Array) {
          const embeddedResolverDecorators = definitionWithConfig.embeddedConfigs?.find(
            (config) => config.property === property.name,
          );
          providers.push(
            createResolverForEmbedded(
              definition,
              property.name,
              contextDecorator,
              embeddedResolverDecorators,
            ),
          );
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

    const pureDefinitions = input.definitions.map((definitionOrDefinitionConfig) =>
      util.isFunction(definitionOrDefinitionConfig)
        ? definitionOrDefinitionConfig
        : (definitionOrDefinitionConfig as DefinitionWithConfig).definition,
    ) as Definition[];

    const mongooseForFeatureModule = MongooseModule.forFeature(
      pureDefinitions.map((definition) => {
        const schema = SchemaFactory.createForClass(definition);
        schema.set('id', false);
        schema.plugin(mongoosePaginateV2);
        schema.virtual('id').get(function () {
          return this._id;
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
    const baseServicesProviders = pureDefinitions.map((definition) => ({
      provide: getBaseServiceToken(definition),
      useClass: createBaseService(definition),
    }));
    return {
      module: DryerModule,
      imports: util.defaultTo(input.imports, []),
      providers: [
        DefaultHook,
        ...providers,
        ...mongooseModuleExports,
        ...baseServicesProviders,
        { useValue: input, provide: DRYER_MODULE_OPTIONS },
        { useValue: pureDefinitions, provide: DRYER_DEFINITIONS },
        ...util.defaultTo(input.providers, []),
      ],
      exports: [
        ...mongooseModuleExports,
        ...baseServicesProviders,
        ...providers,
        { useValue: input, provide: DRYER_MODULE_OPTIONS },
      ],
    };
  }
}
