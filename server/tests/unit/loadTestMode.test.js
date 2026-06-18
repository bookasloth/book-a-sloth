const { isLoadTestMode } = require('../../config/loadTestMode');

describe('isLoadTestMode', () => {
  const OLD = process.env;
  beforeEach(() => { process.env = { ...OLD }; });
  afterAll(() => { process.env = OLD; });

  test('off when unset (dev)', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.LOAD_TEST_MODE;
    expect(isLoadTestMode()).toBe(false);
  });

  test('on when "true" and non-prod', () => {
    process.env.NODE_ENV = 'development';
    process.env.LOAD_TEST_MODE = 'true';
    expect(isLoadTestMode()).toBe(true);
  });

  test('OFF in production even when "true" (fail-safe)', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOAD_TEST_MODE = 'true';
    expect(isLoadTestMode()).toBe(false);
  });

  test('off when value is not exactly "true"', () => {
    process.env.NODE_ENV = 'development';
    process.env.LOAD_TEST_MODE = '1';
    expect(isLoadTestMode()).toBe(false);
  });
});
