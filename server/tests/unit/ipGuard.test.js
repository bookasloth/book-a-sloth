// Unit tests for ipGuard + offenseTracker + getClientIp. ipBlocklist is mocked so
// these tests focus purely on the middleware behaviour (enforcement, exemptions,
// fail-open, 429 → offense recording, header-based client IP).

const OLD_ENV = process.env;

function mockRes() {
  const res = { statusCode: 200, body: undefined, _finish: null };
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn((b) => { res.body = b; return res; });
  res.on = jest.fn((ev, cb) => { if (ev === 'finish') res._finish = cb; });
  return res;
}

function load({ env = {}, blocklist = {} } = {}) {
  jest.resetModules();
  process.env = { ...OLD_ENV, IP_BLOCK_ENABLED: 'true', ...env };
  const mock = {
    isBlocked: blocklist.isBlocked || jest.fn(() => false),
    recordRateLimitViolation: blocklist.recordRateLimitViolation || jest.fn(() => Promise.resolve()),
  };
  jest.doMock('../../lib/ipBlocklist', () => mock);
  // loadTestMode is real; default off. Allow override via env if a test needs it.
  const mod = require('../../middleware/ipGuard');
  return { mod, mock };
}

afterAll(() => { process.env = OLD_ENV; });

describe('ipGuard enforcement', () => {
  test('403s a banned IP and does not call next', () => {
    const { mod } = load({ blocklist: { isBlocked: jest.fn(() => true) } });
    const req = { ip: '1.2.3.4', path: '/api/host/services', headers: {} };
    const res = mockRes();
    const next = jest.fn();

    mod.ipGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access denied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('passes a non-banned IP through', () => {
    const { mod } = load({ blocklist: { isBlocked: jest.fn(() => false) } });
    const req = { ip: '1.2.3.4', path: '/api/host/services', headers: {} };
    const res = mockRes();
    const next = jest.fn();

    mod.ipGuard(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('never blocks the Razorpay webhook path even if the IP is banned', () => {
    const isBlocked = jest.fn(() => true);
    const { mod } = load({ blocklist: { isBlocked } });
    const req = { ip: '1.2.3.4', path: '/api/payment/webhook', headers: {} };
    const res = mockRes();
    const next = jest.fn();

    mod.ipGuard(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(isBlocked).not.toHaveBeenCalled(); // exempt short-circuits before the lookup
  });

  test('never blocks the health probe', () => {
    const { mod } = load({ blocklist: { isBlocked: jest.fn(() => true) } });
    const req = { ip: '1.2.3.4', path: '/health', headers: {} };
    const res = mockRes();
    const next = jest.fn();

    mod.ipGuard(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('disabled (IP_BLOCK_ENABLED=false) passes everything through', () => {
    const { mod } = load({ env: { IP_BLOCK_ENABLED: 'false' }, blocklist: { isBlocked: jest.fn(() => true) } });
    const req = { ip: '1.2.3.4', path: '/api/host/services', headers: {} };
    const res = mockRes();
    const next = jest.fn();

    mod.ipGuard(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('fails open if the blocklist throws', () => {
    const { mod } = load({ blocklist: { isBlocked: jest.fn(() => { throw new Error('cache boom'); }) } });
    const req = { ip: '1.2.3.4', path: '/api/host/services', headers: {} };
    const res = mockRes();
    const next = jest.fn();

    mod.ipGuard(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('offenseTracker', () => {
  test('records a rate-limit violation when the response is 429', () => {
    const recordRateLimitViolation = jest.fn(() => Promise.resolve());
    const { mod } = load({ blocklist: { recordRateLimitViolation } });
    const req = { ip: '9.8.7.6', path: '/api/auth/login', headers: {} };
    const res = mockRes();
    const next = jest.fn();

    mod.offenseTracker(req, res, next);
    expect(next).toHaveBeenCalled();

    res.statusCode = 429;
    res._finish(); // simulate response finishing

    expect(recordRateLimitViolation).toHaveBeenCalledWith('9.8.7.6');
  });

  test('does NOT record on a normal 200 response', () => {
    const recordRateLimitViolation = jest.fn(() => Promise.resolve());
    const { mod } = load({ blocklist: { recordRateLimitViolation } });
    const req = { ip: '9.8.7.6', path: '/api/auth/login', headers: {} };
    const res = mockRes();

    mod.offenseTracker(req, res, jest.fn());
    res.statusCode = 200;
    res._finish();

    expect(recordRateLimitViolation).not.toHaveBeenCalled();
  });
});

describe('getClientIp', () => {
  test('uses req.ip when no CLIENT_IP_HEADER is configured', () => {
    const { mod } = load();
    expect(mod.getClientIp({ ip: '5.5.5.5', headers: {} })).toBe('5.5.5.5');
  });

  test('reads the configured header (first value) when set', () => {
    const { mod } = load({ env: { CLIENT_IP_HEADER: 'cf-connecting-ip' } });
    const req = { ip: '10.0.0.1', headers: { 'cf-connecting-ip': '203.0.113.7, 70.41.3.18' } };
    expect(mod.getClientIp(req)).toBe('203.0.113.7');
  });

  test('falls back to req.ip when the configured header is absent', () => {
    const { mod } = load({ env: { CLIENT_IP_HEADER: 'cf-connecting-ip' } });
    expect(mod.getClientIp({ ip: '10.0.0.1', headers: {} })).toBe('10.0.0.1');
  });
});
