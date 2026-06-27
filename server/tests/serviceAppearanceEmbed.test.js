'use strict';

/**
 * Focused test for getPublicAppearanceData — the new logic that lets the public
 * service payload embed the host appearance. Mirrors loadRow()'s exact supabase
 * chain: .from('appearance_settings').select('*').eq('id', 1).maybeSingle().
 */

jest.mock('../config/supabase', () => {
  const row = {
    backgrounds: {
      dotgrid: { enabled: true, order: 1, params: {} },
      galaxy: { enabled: false },
    },
    default_background: 'dotgrid',
  };
  return {
    supabaseAdmin: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: row, error: null }),
          }),
        }),
      }),
    },
  };
});

const { getPublicAppearanceData } = require('../controllers/appearanceController');

describe('getPublicAppearanceData', () => {
  it('returns enabled-only backgrounds + default', async () => {
    const out = await getPublicAppearanceData();
    expect(out.default_background).toBe('dotgrid');
    expect(out.backgrounds).toEqual([{ key: 'dotgrid', params: {} }]);
  });
});
