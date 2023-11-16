import { registerEnumType, InputType, Field } from '@nestjs/graphql';

export enum RemoveMode {
  RequiredCleanRelations = 'RequiredCleanRelations',
  IgnoreRelations = 'IgnoreRelations',
  CleanUpRelationsAfterRemoved = 'CleanUpRelationsAfterRemoved',
}

registerEnumType(RemoveMode, { name: 'RemoveMode' });

@InputType()
export class RemoveOptions {
  @Field(() => RemoveMode, { defaultValue: RemoveMode.RequiredCleanRelations })
  mode: RemoveMode;

  isOriginalRequest = true;
}
