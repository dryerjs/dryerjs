import { Field } from '@nestjs/graphql';
import { Property, Thunk } from './property';

describe('Property with Thunk', () => {
  it('Should throw error when use Property and then Thunk', () => {
    try {
      class Test {
        @Property()
        @Thunk(Field())
        name: string;
      }
      new Test();
      throw new Error('Should not reach here');
    } catch (error: any) {
      expect(error.message).toContain('already has a @Thunk decorator');
    }
  });

  it('Should throw error when use Thunk and then Property', () => {
    try {
      class Test {
        @Thunk(Field())
        @Property()
        name: string;
      }
      new Test();
      throw new Error('Should not reach here');
    } catch (error: any) {
      expect(error.message).toContain('already has a @Property decorator');
    }
  });
});
