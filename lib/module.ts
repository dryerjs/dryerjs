import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import * as mongoosePaginateV2 from './js/mongoose-paginate-v2';
import { createResolver, createResolverForEmbedded, createResolverForReferencesMany } from './resolvers';
import { inspect } from './inspect';
import { Definition } from './definition';
import { createReferencesManyLoader } from './dataloaders';

@Module({})
export class DryerModule {
  public static MongooseModuleForFeatureModule: DynamicModule;

  public static register(input: { definitions: Definition[] }): DynamicModule {
    const providers: Provider[] = [];
    input.definitions.forEach((definition) => providers.push(createResolver(definition)));
    input.definitions.forEach((definition) => {
      for (const property of inspect(definition).embeddedProperties) {
        providers.push(createResolverForEmbedded(definition, property.name));
      }
      for (const property of inspect(definition).referencesManyProperties) {
        providers.push(createResolverForReferencesMany(definition, property.name));
        providers.push({
          provide: `${definition.name}Loader`,
          useClass: createReferencesManyLoader(definition, property.name),
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

    return {
      module: DryerModule,
      providers: [...providers, ...mongooseModuleExports],
      exports: [...mongooseModuleExports],
    };
  }
}
