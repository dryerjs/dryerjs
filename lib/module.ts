import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';

import * as util from './util';
import { ContextDecorator, defaultContextDecorator } from './context';
import * as mongoosePaginateV2 from './js/mongoose-paginate-v2';
import { createResolver, createResolverForEmbedded, createResolverForReferencesMany } from './resolvers';
import { inspect } from './inspect';
import { Definition } from './definition';
import { createBaseService, getBaseServiceToken } from './base.service';

@Module({})
export class DryerModule {
  public static MongooseModuleForFeatureModule: DynamicModule;

  public static register(input: {
    definitions: Definition[];
    contextDecorator?: ContextDecorator;
  }): DynamicModule {
    const contextDecorator = util.defaultTo(input.contextDecorator, defaultContextDecorator);
    const providers: Provider[] = [];
    input.definitions.forEach((definition) => providers.push(createResolver(definition, contextDecorator)));
    input.definitions.forEach((definition) => {
      for (const property of inspect(definition).embeddedProperties) {
        providers.push(createResolverForEmbedded(definition, property.name, contextDecorator));
      }
      for (const property of inspect(definition).referencesManyProperties) {
        providers.push(createResolverForReferencesMany(definition, property.name, contextDecorator));
      }
    });
    const mongooseForFeatureModule = MongooseModule.forFeature(
      input.definitions.map((definition) => {
        const schema = SchemaFactory.createForClass(definition);
        schema.plugin(mongoosePaginateV2);
        return {
          name: definition.name,
          schema,
        };
      }),
    );

    const mongooseModuleExports = mongooseForFeatureModule.exports as any;
    const baseServicesProviders = input.definitions.map((definition) => ({
      provide: getBaseServiceToken(definition),
      useClass: createBaseService(definition),
    }));
    return {
      module: DryerModule,
      providers: [...providers, ...mongooseModuleExports, ...baseServicesProviders],
      exports: [...mongooseModuleExports, ...baseServicesProviders],
    };
  }
}
