import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';

import * as util from './util';
import { Definition } from './shared';
import { createResolver, createResolverForEmbedded, createResolverForReferencesMany } from './resolvers';
import { embeddedCached, referencesManyCache } from './property';

@Module({})
export class DryerModule {
  public static MongooseModuleForFeatureModule: DynamicModule;

  public static register(input: { definitions: Definition[] }): DynamicModule {
    const providers: Provider[] = [];
    input.definitions.forEach((definition) => providers.push(createResolver(definition)));
    input.definitions.forEach((definition) => {
      for (const property in util.defaultTo(embeddedCached[definition.name], {})) {
        providers.push(createResolverForEmbedded(definition, property));
      }
      for (const property in util.defaultTo(referencesManyCache[definition.name], {})) {
        providers.push(createResolverForReferencesMany(definition, property));
      }
    });

    return {
      module: DryerModule,
      imports: [
        MongooseModule.forFeature(
          input.definitions.map((definition) => ({
            name: definition.name,
            schema: SchemaFactory.createForClass(definition),
          })),
        ),
      ],
      providers,
    };
  }
}
