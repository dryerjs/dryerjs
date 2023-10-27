import { Definition } from './entity';
import { inspect } from './inspect';

describe('inspect', () => {
  it('isApiAllowed works', () => {
    @Definition({ allowedApis: '*' })
    class AllowAny {}
    expect(inspect(AllowAny).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('bulkCreate')).toBe(true);

    @Definition({ allowedApis: 'essentials' })
    class AllowedEssentials {}
    expect(inspect(AllowedEssentials).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowedEssentials).isApiAllowed('bulkCreate')).toBe(false);

    @Definition({ allowedApis: ['create', 'getAll'] })
    class AllowedSpecific {}
    expect(inspect(AllowedSpecific).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowedSpecific).isApiAllowed('bulkCreate')).toBe(false);
  });
});
