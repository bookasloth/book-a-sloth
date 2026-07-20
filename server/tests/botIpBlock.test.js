const { isBlocked, block, _reset } = require('../lib/botIpBlock');

describe('botIpBlock', () => {
  beforeEach(() => _reset());
  afterEach(() => jest.restoreAllMocks());

  it('block then isBlocked → true', async () => {
    await block('1.2.3.4', 1800);
    expect(await isBlocked('1.2.3.4')).toBe(true);
  });

  it('unknown ip → false', async () => {
    expect(await isBlocked('9.9.9.9')).toBe(false);
  });

  it('falsy ip → block no-ops, isBlocked false', async () => {
    await block(null, 1800);
    await block('', 1800);
    expect(await isBlocked(null)).toBe(false);
    expect(await isBlocked('')).toBe(false);
  });

  it('ttl <= 0 → no-op', async () => {
    await block('5.5.5.5', 0);
    expect(await isBlocked('5.5.5.5')).toBe(false);
  });

  it('expiry: isBlocked false once past expiry', async () => {
    const start = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(start);
    await block('7.7.7.7', 1);
    expect(await isBlocked('7.7.7.7')).toBe(true);
    Date.now.mockReturnValue(start + 1001);
    expect(await isBlocked('7.7.7.7')).toBe(false);
  });

  it('_reset clears', async () => {
    await block('8.8.8.8', 1800);
    _reset();
    expect(await isBlocked('8.8.8.8')).toBe(false);
  });
});
