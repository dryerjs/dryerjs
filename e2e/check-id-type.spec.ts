import { Id, Property, Skip } from '../lib/property';
import { Definition } from '../lib/definition';
import { GraphQLObjectId, ObjectId } from '../lib/object-id';

describe('Check id type is ObjectId or string', () => {
  it('Define id type string should throw error', async () => {
    expect(() => {
      @Definition()
      class User {
        @Id()
        id: string;
      }
      const user = new User();
      Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })(user, 'id');
    }).toThrowError('Property id should have type ObjectId');
  });

  it('Define id type ObjectId does not throw error', async () => {
    expect(() => {
      @Definition()
      class User {
        @Id()
        id: ObjectId;
      }
      const user = new User();
      Property({ type: () => GraphQLObjectId, create: Skip, db: Skip })(user, 'id');
    }).not.toThrowError();
  });
});
