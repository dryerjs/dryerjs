import * as graphql from 'graphql';
import { Embedded, Property, Thunk } from '../../lib/property';
import { Field } from '@nestjs/graphql';
import { CreateInputType, OutputType, UpdateInputType } from '../../lib/type-functions';
import { Definition } from '../../lib/definition';
import { Prop, SchemaFactory } from '@nestjs/mongoose';

@Definition()
class Creator {
  @Property(() => graphql.GraphQLString)
  name: string;
}

const creatorSchema = SchemaFactory.createForClass(Creator);
creatorSchema.virtual('id').get(function () {
  return (this['_id'] as any).toHexString();
});

@Definition()
class Brand {
  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: creatorSchema })
  @Thunk(Field(() => OutputType(Creator), { nullable: true }), { scopes: 'output' })
  @Thunk(Field(() => CreateInputType(Creator), { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => UpdateInputType(Creator), { nullable: true }), { scopes: 'update' })
  @Embedded(() => Creator)
  creator: Creator;
}

const brandSchema = SchemaFactory.createForClass(Brand);
brandSchema.virtual('id').get(function () {
  return (this['_id'] as any).toHexString();
});

@Definition({ allowedApis: '*' })
export class Computer {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: brandSchema })
  @Thunk(Field(() => OutputType(Brand), { nullable: true }), { scopes: 'output' })
  @Thunk(Field(() => CreateInputType(Brand), { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => UpdateInputType(Brand), { nullable: true }), { scopes: 'update' })
  @Embedded(() => Brand)
  brand: Brand;
}
