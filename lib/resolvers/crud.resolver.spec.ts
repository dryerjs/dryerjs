import { isApiAllowed } from './crud.resolver';

describe('crud.resolver', () => {
  it('isApiAllowed works', () => {
    expect(isApiAllowed('paginate', '*')).toBe(true);
    expect(isApiAllowed('create', '*')).toBe(true);
    expect(isApiAllowed('update', '*')).toBe(true);
    expect(isApiAllowed('findOne', '*')).toBe(true);
    expect(isApiAllowed('remove', '*')).toBe(true);
    expect(isApiAllowed('findAll', '*')).toBe(true);
    expect(isApiAllowed('bulkCreate', '*')).toBe(true);
    expect(isApiAllowed('bulkUpdate', '*')).toBe(true);
    expect(isApiAllowed('bulkRemove', '*')).toBe(true);

    expect(isApiAllowed('create', 'essentials')).toBe(true);
    expect(isApiAllowed('paginate', 'essentials')).toBe(true);
    expect(isApiAllowed('update', 'essentials')).toBe(true);
    expect(isApiAllowed('findOne', 'essentials')).toBe(true);
    expect(isApiAllowed('remove', 'essentials')).toBe(true);

    expect(isApiAllowed('bulkCreate', 'essentials')).toBe(false);
    expect(isApiAllowed('findAll', 'essentials')).toBe(false);
    expect(isApiAllowed('bulkUpdate', 'essentials')).toBe(false);
    expect(isApiAllowed('bulkRemove', 'essentials')).toBe(false);

    expect(isApiAllowed('create', ['create', 'findAll'])).toBe(true);
    expect(isApiAllowed('findAll', ['create', 'findAll'])).toBe(true);

    expect(isApiAllowed('paginate', ['create', 'findAll'])).toBe(false);
    expect(isApiAllowed('update', ['create', 'findAll'])).toBe(false);
    expect(isApiAllowed('findOne', ['create', 'findAll'])).toBe(false);
    expect(isApiAllowed('remove', ['create', 'findAll'])).toBe(false);
    expect(isApiAllowed('bulkCreate', ['create', 'findAll'])).toBe(false);
    expect(isApiAllowed('bulkUpdate', ['create', 'findAll'])).toBe(false);
    expect(isApiAllowed('bulkRemove', ['create', 'findAll'])).toBe(false);
  });
});
