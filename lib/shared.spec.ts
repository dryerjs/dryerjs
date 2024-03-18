import { setQueryContextForFilter, getQueryContextFromFilter } from './shared';

it('QueryContext works', () => {
  const filter = {};
  setQueryContextForFilter(filter, {
    source: 'Test',
  });
  expect(getQueryContextFromFilter(filter)).toEqual({
    source: 'Test',
  });
});
