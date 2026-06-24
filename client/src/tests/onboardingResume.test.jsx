/**
 * tests/onboardingResume.test.jsx
 * Verifies ProtectedRoute's explicit resume map sends hosts to the right step.
 *
 * Strategy: render ProtectedRoute under a MemoryRouter that includes a
 * catch-all Route to capture where Navigate lands.  We read the resulting
 * rendered output (the "landed" route renders a sentinel element) rather
 * than spying on navigate directly.
 *
 * Covers:
 *  - stepCompleted:3 → /category (not /booking-type or any old path)
 *  - stepCompleted:1 → /claim
 *  - stepCompleted:4 → /whatsapp
 *  - isComplete:true  → children render (no redirect)
 *  - no slug          → children render (legacy host, not trapped)
 *  - non-host         → children render, getOnboardingStatus never called
 */
import { render, waitFor, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// --- Mock api module -------------------------------------------------------
vi.mock('../services/api', () => ({
  getOnboardingStatus: vi.fn(),
}));

// --- Mock AuthContext -------------------------------------------------------
const mockUser = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser(), loading: false }),
}));

import { getOnboardingStatus } from '../services/api';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Sentinel elements — each route in the test router renders a unique testid
// so we can assert where the user "landed" after ProtectedRoute redirects.
const Child       = () => <div data-testid="child">Protected child</div>;
const LandClaim   = () => <div data-testid="land-claim">claim</div>;
const LandAbout   = () => <div data-testid="land-about">about</div>;
const LandCategory = () => <div data-testid="land-category">category</div>;
const LandWhatsapp = () => <div data-testid="land-whatsapp">whatsapp</div>;
const LandPlan    = () => <div data-testid="land-plan">plan</div>;

function renderProtectedAt(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* The protected route the user is trying to reach */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Child />
            </ProtectedRoute>
          }
        />
        {/* Sentinel routes that capture where ProtectedRoute redirected to */}
        <Route path="/vendor-register/:slug/claim"    element={<LandClaim />} />
        <Route path="/vendor-register/:slug/about"    element={<LandAbout />} />
        <Route path="/vendor-register/:slug/category" element={<LandCategory />} />
        <Route path="/vendor-register/:slug/whatsapp" element={<LandWhatsapp />} />
        <Route path="/vendor-register/:slug/plan"     element={<LandPlan />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute resume map', () => {
  test('host with stepCompleted:3 (about done) is redirected to /category', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 3, isComplete: false, slug: 'me' },
    });

    renderProtectedAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByTestId('land-category')).toBeTruthy();
    });
    // Must NOT have landed on children or an old route
    expect(screen.queryByTestId('child')).toBeNull();
  });

  test('host with stepCompleted:1 (Google done) is redirected to /claim', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 1, isComplete: false, slug: 'me' },
    });

    renderProtectedAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByTestId('land-claim')).toBeTruthy();
    });
    expect(screen.queryByTestId('child')).toBeNull();
  });

  test('host with stepCompleted:4 (category done) is redirected to /whatsapp', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 4, isComplete: false, slug: 'me' },
    });

    renderProtectedAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByTestId('land-whatsapp')).toBeTruthy();
    });
    expect(screen.queryByTestId('child')).toBeNull();
  });

  test('host with isComplete:true passes through to children', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 6, isComplete: true, slug: 'me' },
    });

    renderProtectedAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeTruthy();
    });
  });

  test('host with no onboarding_slug (legacy host) passes through to children', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    // Legacy host: slug is null — should not be redirected into onboarding
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 0, isComplete: false, slug: null },
    });

    renderProtectedAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeTruthy();
    });
  });

  test('non-host user passes through to children without calling getOnboardingStatus', async () => {
    mockUser.mockReturnValue({ role: 'guest' });

    renderProtectedAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeTruthy();
    });
    expect(getOnboardingStatus).not.toHaveBeenCalled();
  });
});
