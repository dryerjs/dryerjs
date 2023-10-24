import * as util from './util';

describe('util', () => {
  it('deepOmit', () => {
    const object = {
      a: 1,
      b: 2,
      c: {
        d: 3,
        e: 4,
      },
    };

    const result = util.deepOmit(object, ['b', 'd']);

    expect(result).toEqual({
      a: 1,
      c: {
        e: 4,
      },
    });

    expect(util.deepOmit(null, ['key'])).toBe(null);
    expect(util.deepOmit('not_an_object', ['key'])).toBe('not_an_object');
    expect(util.deepOmit([{ a: 1, b: 2 }], ['a'])).toEqual([{ b: 2 }]);
  });

  it('defaultTo', () => {
    expect(util.defaultTo(NaN, 100)).toEqual(100);
  });

  it('isTruthy', () => {
    expect(util.isTruthy(1)).toBe(true);
    expect(util.isTruthy(0)).toBe(false);
    expect(util.isTruthy('')).toBe(false);
    expect(util.isTruthy('0')).toBe(true);
    expect(util.isTruthy(true)).toBe(true);
    expect(util.isTruthy(false)).toBe(false);
    expect(util.isTruthy(null)).toBe(false);
    expect(util.isTruthy(undefined)).toBe(false);
  });

  it('isNotNil', () => {
    expect(util.isNotNil(1)).toBe(true);
    expect(util.isNotNil(0)).toBe(true);
    expect(util.isNotNil('')).toBe(true);
    expect(util.isNotNil('0')).toBe(true);
    expect(util.isNotNil(true)).toBe(true);
    expect(util.isNotNil(false)).toBe(true);
    expect(util.isNotNil(null)).toBe(false);
    expect(util.isNotNil(undefined)).toBe(false);
  });

  it('isFunction', () => {
    expect(util.isFunction(() => {})).toBe(true);
    expect(util.isFunction('not_a_function')).toBe(false);
  });

  it('isNotNullObject', () => {
    expect(util.isNotNullObject({})).toBe(true);
    expect(util.isNotNullObject(null)).toBe(false);
    expect(util.isNotNullObject(undefined)).toBe(false);
  });
});
