import { MongoHelper } from './mongo-helper';

describe('MongoHelper', () => {
  describe('toQuery', () => {
    it('should convert GraphQL id to Mongo _id in filter query', () => {
      const graphqlFilter = {
        id: {
          eq: 'Jerry',
        },
      };

      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        _id: {
          $eq: 'Jerry',
        },
      });
    });

    it('should convert GraphQL filter to Mongo query', () => {
      const graphqlFilter = {
        name: {
          eq: 'John',
        },
        age: {
          gt: 18,
        },
      };

      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        name: { $eq: 'John' },
        age: { $gt: 18 },
      });
    });

    it('in and notIn', () => {
      const graphqlFilter = {
        colors: {
          in: ['red', 'blue'],
        },
        sizes: {
          notIn: ['small', 'medium'],
        },
      };

      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        colors: { $in: ['red', 'blue'] },
        sizes: { $nin: ['small', 'medium'] },
      });
    });

    it('contains and notContains', () => {
      const graphqlFilter = {
        firstName: {
          contains: 'John',
        },
        lastName: {
          notContains: 'Doe',
        },
      };

      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        firstName: { $regex: 'John', $options: 'i' },
        lastName: { $not: { $regex: 'Doe', $options: 'i' } },
      });
    });

    it('regex and notRegex', () => {
      const graphqlFilter = {
        firstName: {
          regex: 'John',
        },
        lastName: {
          notRegex: 'Doe',
        },
      };

      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        firstName: { $regex: 'John', $options: 'i' },
        lastName: { $not: { $regex: 'Doe', $options: 'i' } },
      });
    });

    it('lt and lte', () => {
      const graphqlFilter = {
        price: {
          lt: 100,
        },
        quantity: {
          lte: 10,
        },
      };

      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        price: { $lt: 100 },
        quantity: { $lte: 10 },
      });
    });

    it('gt and gte', () => {
      const graphqlFilter = {
        score: {
          gt: 90,
        },
        stock: {
          gte: 50,
        },
      };

      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        score: { $gt: 90 },
        stock: { $gte: 50 },
      });
    });

    it('exists', () => {
      expect(
        MongoHelper.toQuery({
          firstName: {
            exists: true,
          },
        }),
      ).toEqual({
        firstName: { $ne: null },
      });

      expect(
        MongoHelper.toQuery({
          firstName: {
            exists: false,
          },
        }),
      ).toEqual({
        firstName: {
          $not: {
            $ne: null,
          },
        },
      });
    });

    it('should handle unknown operators in GraphQl filter', () => {
      expect(() => {
        const graphqlFilter = {
          name: {
            unknownOperator: 'John',
          },
        };

        MongoHelper.toQuery(graphqlFilter);
      }).toThrow(`Unknown filter operator: unknownOperator`);
    });

    it('should handle null and undefined values', () => {
      const graphqlFilter = {
        name: {
          eq: null,
        },
        age: {
          eq: undefined,
        },
      };
      const mongoQuery = MongoHelper.toQuery(graphqlFilter);

      expect(mongoQuery).toEqual({
        name: {
          $eq: null,
        },
        age: {
          $eq: undefined,
        },
      });
    });
  });

  describe('getSortObject()', () => {
    it('should convert GraphQL id to Mongo _id', () => {
      const sortQuery = MongoHelper.getSortObject(undefined, {
        id: 'DESC',
        name: 'ASC',
      });

      expect(sortQuery).toEqual({
        _id: 'DESC',
        name: 'ASC',
      });
    });
  });
});
