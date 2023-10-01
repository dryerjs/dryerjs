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
    });
});
