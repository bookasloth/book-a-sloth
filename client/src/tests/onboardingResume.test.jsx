/**
 * tests/onboardingResume.test.jsx
 * Verifies ProtectedRoute's explicit resume map sends hosts to the right step.
 *
 * Covers:
 *  - stepCompleted:3 → /category (not /booking-type or any old path)
 *  - isComplete:true  → children render (no redirect)
 *  - no slug          → children render (legacy host, not trapped)
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

// Helper: render ProtectedRoute inside a router, capture where it lands.
function renderProtected(initialPath = '/dashboard') {
  const locations = [];

  const LocationCapture = () => {
    const { useLocation } = require('react-router-dom');
    const loc = useLocation();
    locations.push(loc.pathname);
    return null;
  };

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationCapture />
      <Routes>
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <div data-testid="protected-child">Protected</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

  return { locations };
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

    const { locations } = renderProtected('/dashboard');

    await waitFor(() => {
      expect(locations).toContain('/vendor-register/me/category');
    });

    // Must NOT redirect to any old route
    expect(locations).not.toContain('/vendor-register/me/booking-type');
    expect(locations).not.toContain('/vendor-register/me/booking');
  });

  test('host with stepCompleted:1 (Google done) is redirected to /claim', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 1, isComplete: false, slug: 'me' },
    });

    const { locations } = renderProtected('/dashboard');

    await waitFor(() => {
      expect(locations).toContain('/vendor-register/me/claim');
    });
  });

  test('host with stepCompleted:4 (category done) is redirected to /whatsapp', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 4, isComplete: false, slug: 'me' },
    });

    const { locations } = renderProtected('/dashboard');

    await waitFor(() => {
      expect(locations).toContain('/vendor-register/me/whatsapp');
    });
  });

  test('host with isComplete:true passes through to children', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 6, isComplete: true, slug: 'me' },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div data-testid="protected-child">Protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-child')).toBeTruthy();
    });
  });

  test('host with no onboarding_slug (legacy host) passes through to children', async () => {
    mockUser.mockReturnValue({ role: 'host' });
    // Legacy host: no slug in status
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 0, isComplete: false, slug: null },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div data-testid="protected-child">Protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-child')).toBeTruthy();
    });
  });

  test('non-host user passes through to children without calling getOnboardingStatus', async () => {
    mockUser.mockReturnValue({ role: 'guest' });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div data-testid="protected-child">Protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-child')).toBeTruthy();
    });
    expect(getOnboardingStatus).not.toHaveBeenCalled();
  });
});
