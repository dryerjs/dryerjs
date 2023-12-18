import { Definition } from './definition';
import { inspect } from './inspect';

describe('inspect', () => {
  it('isApiAllowed works', () => {
    @Definition({ allowedApis: '*' })
    class AllowAny {}
    expect(inspect(AllowAny).isApiAllowed('paginate')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('update')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('findOne')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('remove')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('findAll')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('bulkCreate')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('bulkUpdate')).toBe(true);
    expect(inspect(AllowAny).isApiAllowed('bulkRemove')).toBe(true);

    @Definition({ allowedApis: 'essentials' })
    class AllowedEssentials {}
    expect(inspect(AllowedEssentials).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowedEssentials).isApiAllowed('paginate')).toBe(true);
    expect(inspect(AllowedEssentials).isApiAllowed('update')).toBe(true);
    expect(inspect(AllowedEssentials).isApiAllowed('findOne')).toBe(true);
    expect(inspect(AllowedEssentials).isApiAllowed('remove')).toBe(true);

    expect(inspect(AllowedEssentials).isApiAllowed('bulkCreate')).toBe(false);
    expect(inspect(AllowedEssentials).isApiAllowed('findAll')).toBe(false);
    expect(inspect(AllowedEssentials).isApiAllowed('bulkUpdate')).toBe(false);
    expect(inspect(AllowedEssentials).isApiAllowed('bulkRemove')).toBe(false);

    @Definition({ allowedApis: ['create', 'findAll'] })
    class AllowedSpecific {}
    expect(inspect(AllowedSpecific).isApiAllowed('create')).toBe(true);
    expect(inspect(AllowedSpecific).isApiAllowed('findAll')).toBe(true);

    expect(inspect(AllowedSpecific).isApiAllowed('paginate')).toBe(false);
    expect(inspect(AllowedSpecific).isApiAllowed('update')).toBe(false);
    expect(inspect(AllowedSpecific).isApiAllowed('findOne')).toBe(false);
    expect(inspect(AllowedSpecific).isApiAllowed('remove')).toBe(false);
    expect(inspect(AllowedSpecific).isApiAllowed('bulkCreate')).toBe(false);
    expect(inspect(AllowedSpecific).isApiAllowed('bulkUpdate')).toBe(false);
    expect(inspect(AllowedSpecific).isApiAllowed('bulkRemove')).toBe(false);
  });
});
