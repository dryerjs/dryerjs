import { Prop } from '@nestjs/mongoose';
import { BelongTo, Definition, OutputType, Property, Thunk } from '../../lib';
import * as graphql from 'graphql';
import { Product } from './product';
import { Field } from '@nestjs/graphql';

@Definition({ allowedApis: '*' })
export class Image {
  @Property(() => graphql.GraphQLID)
  id: string;

  @Prop({ unique: true })
  @Property(() => graphql.GraphQLString)
  name: string;

  @Prop()
  @Property(() => graphql.GraphQLString)
  productId: string;

  @Prop()
  @BelongTo(() => Product, { from: 'productId' })
  @Thunk(Field(() => [OutputType(Product)]), { scopes: 'output' })
  products: Product[];
}
