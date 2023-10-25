import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import { Definition } from './shared';
import { createResolver, createResolverForEmbedded, createResolverForReferencesMany } from './resolvers';
import { MetaKey, Metadata } from './metadata';

@Module({})
export class DryerModule {
  public static MongooseModuleForFeatureModule: DynamicModule;

  public static register(input: { definitions: Definition[] }): DynamicModule {
    const providers: Provider[] = [];
    input.definitions.forEach((definition) => providers.push(createResolver(definition)));
    input.definitions.forEach((definition) => {
      for (const property in Metadata.getPropertiesByModel(definition, MetaKey.EmbeddedType)) {
        providers.push(createResolverForEmbedded(definition, property));
      }
      for (const property in Metadata.getPropertiesByModel(definition, MetaKey.ReferencesManyType)) {
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
