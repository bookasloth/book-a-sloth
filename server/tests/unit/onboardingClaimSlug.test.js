'use strict';
// Mock supabase before requiring the controller so the module doesn't attempt
// a real DB connection on load.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() }, signInWithPassword: jest.fn() }));
jest.mock('../../utils/notify', () => ({ sendWhatsAppOtp: jest.fn() }));
jest.mock('../../services/email/communicationEngine', () => ({ send: jest.fn(() => Promise.resolve()) }));
// Mock the username service — all tests assert claimSlug goes through:
//   1. usernameExists (history-backed, not profiles.username cache)
//   2. usernameOwner  (history-backed ownership for idempotent self-check)
//   3. setOnboardingUsername → delegates to the set_onboarding_username RPC
//
// NOTE: the RPC's atomicity (retire→insert→update in one transaction) is
// enforced at the Postgres layer (v3.32_set_onboarding_username.sql) and is
// NOT unit-tested here. These tests verify the JS orchestration only.
jest.mock('../../services/usernameService', () => ({
  usernameExists: jest.fn(),
  usernameOwner: jest.fn(),
  setOnboardingUsername: jest.fn(),
}));

const { supabaseAdmin } = require('../../config/supabase');
const usernameService = require('../../services/usernameService');
const { claimSlug, isValidSlug } = require('../../controllers/vendorOnboardingController');

beforeEach(() => jest.clearAllMocks());

// ─── Helper: wire the profiles.update().eq().select().single() chain ────────
// This is the final step in claimSlug after the username service swap succeeds
// (writes onboarding_slug + onboarding_step_completed=2).
const wireProfileUpdate = ({ updateResult = null, updateError = null } = {}) => {
  const updates = [];
  supabaseAdmin.from.mockImplementation((table) => {
    return {
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
    // A slug retired in history (not in any onboarding_slug column) is found by
    // usernameExists. usernameOwner returns a different user → rejected.
    usernameService.usernameExists.mockResolvedValue(true);
    usernameService.usernameOwner.mockResolvedValue('other-vendor');
    await expect(claimSlug('vendor-1', 'retired-name')).rejects.toThrow(/already taken/i);
    expect(usernameService.usernameExists).toHaveBeenCalledWith('retired-name');
    expect(usernameService.setOnboardingUsername).not.toHaveBeenCalled();
  });

  it('rejects a slug owned by a different user via history ownership (not profiles cache)', async () => {
    // Authoritative check: usernameOwner queries username_history, not profiles.username.
    // This prevents a profiles.username cache-divergence window from being bypassed.
    usernameService.usernameExists.mockResolvedValue(true);
    usernameService.usernameOwner.mockResolvedValue('other-vendor');
    await expect(claimSlug('vendor-1', 'taken-slug')).rejects.toThrow(/already taken/i);
    expect(usernameService.usernameOwner).toHaveBeenCalledWith('taken-slug');
    expect(usernameService.setOnboardingUsername).not.toHaveBeenCalled();
  });

  it('rejects a history-reserved name (owner is null — retired, never current) before calling the RPC', async () => {
    // A name that existed historically but has no current owner (usernameOwner returns
    // a user that isn't us) is blocked before the RPC is ever invoked.
    usernameService.usernameExists.mockResolvedValue(true);
    usernameService.usernameOwner.mockResolvedValue('original-owner');
    await expect(claimSlug('vendor-1', 'old-retired-name')).rejects.toThrow(/already taken/i);
    expect(usernameService.setOnboardingUsername).not.toHaveBeenCalled();
  });

  it('allows re-claiming own slug (idempotent) via history ownership, not profiles.username cache', async () => {
    // usernameOwner returns the SAME vendorId → idempotent re-claim proceeds.
    // This is authoritative: even if profiles.username diverged, history is the source of truth.
    usernameService.usernameExists.mockResolvedValue(true);
    usernameService.usernameOwner.mockResolvedValue('vendor-1');
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: true, username: 'my-slug' });
    wireProfileUpdate();
    const result = await claimSlug('vendor-1', 'my-slug');
    expect(result.slug).toBe('my-slug');
    expect(usernameService.usernameOwner).toHaveBeenCalledWith('my-slug');
    expect(usernameService.setOnboardingUsername).toHaveBeenCalledWith('vendor-1', 'my-slug');
  });

  it('calls setOnboardingUsername (which delegates to the set_onboarding_username RPC) on success', async () => {
    // Verifies the JS layer calls the service (which wraps the atomic RPC) rather
    // than performing any direct profiles.username write itself.
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: true, username: 'cool-coach' });
    const { updates } = wireProfileUpdate();
    await claimSlug('vendor-1', 'cool-coach');
    expect(usernameService.setOnboardingUsername).toHaveBeenCalledWith('vendor-1', 'cool-coach');
    // The controller's profiles.update must NOT contain a username field — the RPC owns that write.
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

  it('throws "Slug already taken" when the RPC signals a race (ok:false, reason:taken)', async () => {
    // The set_onboarding_username RPC raises EXCEPTION 'username_taken' on
    // unique-index conflict. usernameService maps that to { ok: false, reason: 'taken' }.
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: false, reason: 'taken' });
    wireProfileUpdate();
    await expect(claimSlug('vendor-1', 'race-slug')).rejects.toThrow(/already taken/i);
  });

  it('throws a generic error when the RPC returns ok:false with a non-taken reason', async () => {
    usernameService.usernameExists.mockResolvedValue(false);
    usernameService.setOnboardingUsername.mockResolvedValue({ ok: false, reason: 'error', detail: 'connection reset' });
    wireProfileUpdate();
    await expect(claimSlug('vendor-1', 'some-slug')).rejects.toThrow(/connection reset/i);
  });
});
