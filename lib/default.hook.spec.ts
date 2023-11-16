import { DefaultHook, FailCleanUpAfterRemoveHandler } from './default.hook';

describe('DefaultHook', () => {
  it('getFailHandler', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const defaultHook = new DefaultHook();
    defaultHook['moduleRef' as any] = {
      get() {
        throw new Error('Not found');
      },
    };

    const handler = defaultHook['getFailHandler']() as FailCleanUpAfterRemoveHandler;
    expect(() => handler.handleItem({} as any, new Error('handleItem'))).toThrow(new Error('handleItem'));
    expect(() => handler.handleAll({} as any, new Error('handleAll'))).toThrow(new Error('handleAll'));
  });
});
