import * as graphql from 'graphql';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { ValidationPipe } from '@nestjs/common';
import { OutputType, CreateInputType } from 'dryerjs';
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
    return await this.User.create(input);
  }

  @Query(() => OutputType(User))
  async whoAmI(@Ctx() context: { userId: string }) {
    const user = await this.User.findById(context.userId);
    if (user === null) {
      throw new graphql.GraphQLError('User not found');
    }
    return user;
  }
}
