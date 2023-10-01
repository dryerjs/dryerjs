import { OutputService } from './output';

describe('OutputService', () => {
    it('lean', () => {
        expect(OutputService['lean']({ _id: '123' })).toEqual({ _id: '123', id: '123' });
        expect(OutputService['lean']({ id: '123' })).toEqual({ id: '123' });
    });
});
