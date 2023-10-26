import * as graphql from 'graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ValidationPipe } from '@nestjs/common';
import { Typer } from '../../lib';
import { User } from '../models';

@Resolver()
export class AuthResolver {
  constructor(@InjectModel('User') private readonly User: Model<User>) {}

  @Mutation(() => Typer.for(User).output)
  async signUp(
    @Args(
      'input',
      { type: () => Typer.for(User).create },
      new ValidationPipe({
        transform: true,
        expectedType: Typer.for(User).create,
      }),
    )
    input: Omit<User, 'id'>,
  ) {
    const user = await this.User.create(input);
    return plainToInstance(Typer.for(User).output, {
      ...user.toObject(),
      id: user._id.toHexString(),
    });
  }

  @Query(() => Typer.for(User).output)
  async whoAmI(@Args('userId', { type: () => graphql.GraphQLString }) userId: string) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new graphql.GraphQLError('User not found');
    }
    return plainToInstance(Typer.for(User).output, user.toObject());
  }
}
