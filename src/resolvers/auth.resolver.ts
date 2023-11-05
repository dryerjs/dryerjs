import * as graphql from 'graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ValidationPipe } from '@nestjs/common';
import { OutputType, CreateInputType } from '../../lib';
import { User } from '../models';
import { Ctx } from '../ctx';

@Resolver()
export class AuthResolver {
  constructor(@InjectModel('User') private readonly User: Model<User>) {}

  @Mutation(() => OutputType(User))
  async signUp(
    @Args(
      'input',
      { type: () => CreateInputType(User) },
      new ValidationPipe({
        transform: true,
        expectedType: CreateInputType(User),
      }),
    )
    input: Omit<User, 'id'>,
  ) {
    const user = await this.User.create(input);
    return plainToInstance(OutputType(User), {
      ...user.toObject(),
      id: user._id.toHexString(),
    });
  }

  @Query(() => OutputType(User))
  async whoAmI(@Ctx() context: { userId: string }) {
    const user = await this.User.findById(context.userId);
    if (!user) {
      throw new graphql.GraphQLError('User not found');
    }
    return plainToInstance(OutputType(User), {
      ...user.toObject(),
      id: user._id.toHexString(),
    });
  }
}
