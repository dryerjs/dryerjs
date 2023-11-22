import { BaseService } from './base.service';

describe('BaseService', () => {
  it('getHooksWithContext', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const baseService = new BaseService();
    baseService['getHooks'] = () => [
      {
        name: 'hook1',
        shouldApplyForContext: () => true,
      },
      {
        name: 'hook2',
        shouldApplyForContext: () => false,
      },
      {
        name: 'hook3',
      },
    ];
    const ctx = {};
    const definition = {};
    const result = baseService['getHooksWithContext']('beforeCreate', ctx, definition);
    expect(result).toEqual([
      {
        name: 'hook1',
        shouldApplyForContext: expect.any(Function),
      },
      {
        name: 'hook3',
      },
    ]);
  });
});
