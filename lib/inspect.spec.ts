import { Entity } from './entity';
import { inspect } from './inspect';

describe('inspect', () => {
  it('isApiAllowed works', () => {
    @Entity({ allowedApis: '*' })
    class AllowAny {}
    expect(inspect(AllowAny).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('bulkCreate')).toBe(true);

    @Entity({ allowedApis: 'essentials' })
    class AllowedEssentials {}
    expect(inspect(AllowedEssentials).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowedEssentials).isApiAllowed('bulkCreate')).toBe(false);

    @Entity({ allowedApis: ['create', 'getAll'] })
    class AllowedSpecific {}
    expect(inspect(AllowedSpecific).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowedSpecific).isApiAllowed('bulkCreate')).toBe(false);
  });
});
