'use strict';
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../utils/logger', () => ({ securityLog: jest.fn(), auditLog: jest.fn(), logger: {} }));
const { supabaseAdmin } = require('../../config/supabase');
const { securityLog } = require('../../utils/logger');
const platformConfig = require('../../services/platformConfig');

const chain = (result) => {
  const c = {};
  for (const m of ['select', 'in']) c[m] = jest.fn(() => c);
  c.then = (resolve) => resolve(result);
  return c;
};

beforeEach(() => { jest.clearAllMocks(); platformConfig.clearCache(); });

test('getConfig returns settlement clearingDays from settings', async () => {
  supabaseAdmin.from.mockImplementation(() => chain({ data: [
    { key: 'settlement_clearing_days', value: '3' },
  ] }));
  const cfg = await platformConfig.getConfig();
  expect(cfg.clearingDays).toBe(3);
});

test('getConfig defaults clearingDays to 7 when unset', async () => {
  supabaseAdmin.from.mockImplementation(() => chain({ data: [] }));
  const cfg = await platformConfig.getConfig();
  expect(cfg.clearingDays).toBe(7);
});

test('getConfig clamps negative clearingDays to default', async () => {
  supabaseAdmin.from.mockImplementation(() => chain({ data: [
    { key: 'settlement_clearing_days', value: '-5' },
  ] }));
  const cfg = await platformConfig.getConfig();
  expect(cfg.clearingDays).toBe(7);
});

test('getConfig falls back to safe defaults AND logs a security event on DB error', async () => {
  supabaseAdmin.from.mockImplementation(() => { throw new Error('db down'); });
  const cfg = await platformConfig.getConfig();
  expect(cfg.platformFee).toBe(10);
  expect(cfg.gstRate).toBe(0.18);
  expect(cfg.clearingDays).toBe(7);
  expect(securityLog).toHaveBeenCalledWith(
    'platform_config_db_fallback',
    expect.objectContaining({ error: 'db down' }),
  );
});
