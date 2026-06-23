'use strict';
// Mock supabase before requiring the controller so the module doesn't attempt
// a real DB connection on load.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() }, signInWithPassword: jest.fn() }));
jest.mock('../../utils/notify', () => ({ sendWhatsAppOtp: jest.fn() }));
jest.mock('../../services/email/communicationEngine', () => ({ send: jest.fn(() => Promise.resolve()) }));

const { supabaseAdmin } = require('../../config/supabase');
const { claimSlug, isValidSlug } = require('../../controllers/vendorOnboardingController');

beforeEach(() => jest.clearAllMocks());

// ─── Helper: wire supabase.from for a claimSlug call ────────────────────
// ownerRow: what the select('id').eq('onboarding_slug').maybeSingle() returns.
// updateResult: what the update().eq().select().single() returns.
const wireClaimSlug = ({ ownerRow = null, updateResult = null, updateError = null } = {}) => {
  const updates = [];
  supabaseAdmin.from.mockImplementation(() => ({
    select: () => ({
      eq: () => ({ maybeSingle: () => Promise.resolve({ data: ownerRow }) }),
    }),
    update: (payload) => {
      updates.push(payload);
      return {
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updateResult || { id: 'v1', onboarding_slug: payload.onboarding_slug }, error: updateError }),
          }),
        }),
      };
    },
  }));
  return { updates };
};

describe('isValidSlug', () => {
  it('accepts valid slugs', () => {
    expect(isValidSlug('yoga-coach')).toBe(true);
    expect(isValidSlug('abc')).toBe(true);
    expect(isValidSlug('creator123')).toBe(true);
  });

  it('rejects too-short, uppercase, spaces, or special chars', () => {
    expect(isValidSlug('ab')).toBe(false);
    expect(isValidSlug('John')).toBe(false);
    expect(isValidSlug('hi there')).toBe(false);
    expect(isValidSlug('no@sign')).toBe(false);
  });
});

describe('claimSlug', () => {
  it('rejects a slug that fails isValidSlug (too short)', async () => {
    wireClaimSlug();
    await expect(claimSlug('vendor-1', 'ab')).rejects.toThrow(/3-60 chars/i);
  });

  it('rejects a slug with special characters (after lowercasing)', async () => {
    // claimSlug lowercases first, so test a char that stays invalid post-lowercase
    wireClaimSlug();
    await expect(claimSlug('vendor-1', 'my slug!')).rejects.toThrow(/3-60 chars/i);
  });

  it('rejects a reserved word', async () => {
    wireClaimSlug();
    await expect(claimSlug('vendor-1', 'admin')).rejects.toThrow(/reserved/i);
  });

  it('rejects another reserved word from the full list', async () => {
    wireClaimSlug();
    await expect(claimSlug('vendor-1', 'dashboard')).rejects.toThrow(/reserved/i);
  });

  it('rejects a slug owned by a different profile', async () => {
    // ownerRow has a different id than the calling vendor
    wireClaimSlug({ ownerRow: { id: 'other-vendor' } });
    await expect(claimSlug('vendor-1', 'taken-slug')).rejects.toThrow(/already taken/i);
  });

  it('allows re-claiming own slug (idempotent for same vendor)', async () => {
    wireClaimSlug({ ownerRow: { id: 'vendor-1' } });
    const result = await claimSlug('vendor-1', 'my-slug');
    expect(result.slug).toBe('my-slug');
  });

  it('writes onboarding_step_completed: 2 and username on success', async () => {
    const { updates } = wireClaimSlug({ ownerRow: null });
    await claimSlug('vendor-1', 'cool-coach');
    expect(updates[0].onboarding_step_completed).toBe(2);
    expect(updates[0].username).toBe('cool-coach');
    expect(updates[0].onboarding_slug).toBe('cool-coach');
  });

  it('lowercases and trims incoming slug before processing', async () => {
    const { updates } = wireClaimSlug({ ownerRow: null });
    await claimSlug('vendor-1', '  Yoga-Coach  ');
    expect(updates[0].onboarding_slug).toBe('yoga-coach');
  });

  it('propagates a supabase update error', async () => {
    wireClaimSlug({ ownerRow: null, updateError: { message: 'DB error' } });
    await expect(claimSlug('vendor-1', 'good-slug')).rejects.toMatchObject({ message: 'DB error' });
  });
});
