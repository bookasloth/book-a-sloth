'use strict';
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
const { supabaseAdmin } = require('../../config/supabase');
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
