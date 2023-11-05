import * as graphql from 'graphql';
import { Embedded, Property, Thunk } from '../../lib/property';
import { Field } from '@nestjs/graphql';
import { CreateInputType, OutputType, UpdateInputType } from '../../lib/type-functions';
import { Definition } from '../../lib/definition';
import { Prop, SchemaFactory } from '@nestjs/mongoose';

@Definition()
class Brand {
  @Property(() => graphql.GraphQLString)
  name: string;

  @Property(() => graphql.GraphQLString)
  creator: string;
}

@Definition({ allowedApis: '*' })
export class Computer {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop({ type: SchemaFactory.createForClass(Brand) })
  @Thunk(Field(() => OutputType(Brand), { nullable: true }), { scopes: 'output' })
  @Thunk(Field(() => CreateInputType(Brand), { nullable: true }), { scopes: 'create' })
  @Thunk(Field(() => UpdateInputType(Brand), { nullable: true }), { scopes: 'update' })
  @Embedded(() => Brand)
  brand: Brand;
}
