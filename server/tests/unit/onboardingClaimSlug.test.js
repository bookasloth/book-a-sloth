'use strict';
// Mock supabase before requiring the controller so the module doesn't attempt
// a real DB connection on load.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() }, signInWithPassword: jest.fn() }));
jest.mock('../../utils/notify', () => ({ sendWhatsAppOtp: jest.fn() }));
jest.mock('../../services/email/communicationEngine', () => ({ send: jest.fn(() => Promise.resolve()) }));
// Mock the username service — all tests assert claimSlug goes through the
// history-backed check (usernameExists) and the non-gated swap (setOnboardingUsername)
// rather than touching profiles.username directly.
jest.mock('../../services/usernameService', () => ({
  usernameExists: jest.fn(),
  setOnboardingUsername: jest.fn(),
}));

const { supabaseAdmin } = require('../../config/supabase');
const usernameService = require('../../services/usernameService');
const { claimSlug, isValidSlug } = require('../../controllers/vendorOnboardingController');

beforeEach(() => jest.clearAllMocks());

// ─── Helper: wire the profiles.update().eq().select().single() chain ────────
// This is the final step after the username service swap succeeds.
const wireProfileUpdate = ({ updateResult = null, updateError = null, selfCheckData = null } = {}) => {
  const updates = [];
  supabaseAdmin.from.mockImplementation((table) => {
    return {
      // Used by the idempotency self-check (select id from profiles where username=clean)
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: selfCheckData }) }),
      }),
      update: (payload) => {
        updates.push(payload);
        return {
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({
                data: updateResult || { id: 'v1', onboarding_slug: payload.onboarding_slug },
                error: updateError,
              }),
            }),
          }),
        };
      },
    };
  });
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
    await expect(claimSlug('vendor-1', 'ab')).rejects.toThrow(/3-60 chars/i);
    expect(usernameService.usernameExists).not.toHaveBeenCalled();
  });

  it('rejects a slug with special characters (after lowercasing)', async () => {
    await expect(claimSlug('vendor-1', 'my slug!')).rejects.toThrow(/3-60 chars/i);
    expect(usernameService.usernameExists).not.toHaveBeenCalled();
  });

  it('rejects a reserved word', async () => {
    await expect(claimSlug('vendor-1', 'admin')).rejects.toThrow(/reserved/i);
    expect(usernameService.usernameExists).not.toHaveBeenCalled();
  });

  it('rejects another reserved word from the full list', async () => {
    await expect(claimSlug('vendor-1', 'dashboard')).rejects.toThrow(/reserved/i);
    expect(usernameService.usernameExists).not.toHaveBeenCalled();
  });

  it('uses the history-backed usernameExists check (not just onboarding_slug)', async () => {
    // Simulate a slug that's retired in history (not in any onboarding_slug column)
    // — usernameExists returns true, selfCheck returns null → should be rejected.
    usernameService.usernameExists.mockResolvedValue(true);
    wireProfileUpdate({ selfCheckData: null }); // no self-match
    await expect(claimSlug('vendor-1', 'retired-name')).rejects.toThrow(/already taken/i);
    expect(usernameService.usernameExists).toHaveBeenCalledWith('retired-name');
    expect(usernameService.setOnboardingUsername).not.toHaveBeenCalled();
  });

  it('rejects a slug owned by a different profile (taken in history)', async () => {
    usernameService.usernameExists.mockResolvedValue(true);
    wireProfileUpdate({ selfCheckData: { id: 'other-vendor' } }); // different owner
    await expect(claimSlug('vendor-1', 'taken-slug')).rejects.toThrow(/already taken/i);
    expect(usernameService.setOnboardingUsername).not.toHaveBeenCalled();
  });

  it('allows re-claiming own slug (idempotent for same vendor)', async () => {
    usernameService.usernameExists.mockResolvedValue(true);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: true, username: 'my-slug' });
    // selfCheck returns the SAME vendor id — idempotent re-claim should proceed
    wireProfileUpdate({ selfCheckData: { id: 'vendor-1' } });
    const result = await claimSlug('vendor-1', 'my-slug');
    expect(result.slug).toBe('my-slug');
    expect(usernameService.setOnboardingUsername).toHaveBeenCalledWith('vendor-1', 'my-slug');
  });

  it('calls setOnboardingUsername (not a bare profiles.username write) on success', async () => {
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: true, username: 'cool-coach' });
    const { updates } = wireProfileUpdate();
    await claimSlug('vendor-1', 'cool-coach');
    // The service handles username — the direct update must NOT include a username field
    expect(usernameService.setOnboardingUsername).toHaveBeenCalledWith('vendor-1', 'cool-coach');
    expect(updates[0]).not.toHaveProperty('username');
  });

  it('writes onboarding_step_completed: 2 and onboarding_slug on success', async () => {
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: true, username: 'cool-coach' });
    const { updates } = wireProfileUpdate();
    await claimSlug('vendor-1', 'cool-coach');
    expect(updates[0].onboarding_step_completed).toBe(2);
    expect(updates[0].onboarding_slug).toBe('cool-coach');
  });

  it('lowercases and trims incoming slug before processing', async () => {
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: true, username: 'yoga-coach' });
    const { updates } = wireProfileUpdate();
    await claimSlug('vendor-1', '  Yoga-Coach  ');
    expect(updates[0].onboarding_slug).toBe('yoga-coach');
    expect(usernameService.setOnboardingUsername).toHaveBeenCalledWith('vendor-1', 'yoga-coach');
  });

  it('propagates a supabase update error (profiles step)', async () => {
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: true, username: 'good-slug' });
    wireProfileUpdate({ updateError: { message: 'DB error' } });
    await expect(claimSlug('vendor-1', 'good-slug')).rejects.toMatchObject({ message: 'DB error' });
  });

  it('throws when setOnboardingUsername returns ok:false (race/taken)', async () => {
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: false, reason: 'taken' });
    wireProfileUpdate();
    await expect(claimSlug('vendor-1', 'race-slug')).rejects.toThrow(/already taken/i);
  });
});
