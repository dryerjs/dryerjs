import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';

import * as util from './util';
import { ContextDecorator, defaultContextDecorator } from './context';
import * as mongoosePaginateV2 from './js/mongoose-paginate-v2';
import { createResolver, createResolverForEmbedded, createResolverForReferencesMany } from './resolvers';
import { inspect } from './inspect';
import { Definition } from './definition';
import { createHasManyLoader, createHasOneLoader, createReferencesManyLoader } from './data-loaders';
import { createResolverForHasMany } from './resolvers/has-many.resolver';
import { createResolverForHasOne } from './resolvers/has-one.resolver';
import { createBaseService, getBaseServiceToken } from './base.service';

@Module({})
export class DryerModule {
  public static MongooseModuleForFeatureModule: DynamicModule;

  public static register(input: {
    definitions: Definition[];
    contextDecorator?: ContextDecorator;
    hooks?: Provider[];
  }): DynamicModule {
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
        providers.push({
          provide: `${definition.name}ReferencesManyLoader`,
          useClass: createReferencesManyLoader(definition, property.name),
        });
      }
      for (const property of inspect(definition).hasManyProperties) {
        providers.push(createResolverForHasMany(definition, property.name));
        providers.push({
          provide: `${definition.name}HasManyLoader`,
          useClass: createHasManyLoader(definition, property.name),
        });
      }
      for (const property of inspect(definition).hasOneProperties) {
        providers.push(createResolverForHasOne(definition, property.name));
        providers.push({
          provide: `${definition.name}HasOneLoader`,
          useClass: createHasOneLoader(definition, property.name),
        });
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
    const hooks = util.defaultTo(input.hooks, []);
    const baseServicesProviders = input.definitions.map((definition) => ({
      provide: getBaseServiceToken(definition),
      useClass: createBaseService(definition, hooks),
    }));
    return {
      module: DryerModule,
      providers: [...providers, ...mongooseModuleExports, ...baseServicesProviders, ...hooks],
      exports: [...mongooseModuleExports, ...baseServicesProviders],
    };
  }
}
