/**
 * tests/onboardingFirstService.test.jsx
 * The "You're live" screen now creates the host's FIRST service inline.
 * Verifies the publish path builds a valid online-service payload (so it never
 * trips the in-person map-link requirement) and completes onboarding.
 */
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/api', () => ({
  getOnboardingStatus:   vi.fn().mockResolvedValue({ data: { stepCompleted: 6, isComplete: false, slug: 'me' } }),
  markOnboardingComplete: vi.fn().mockResolvedValue({ data: {} }),
  svcCreate:             vi.fn().mockResolvedValue({ data: { id: 'svc-1' } }),
  hostGetCategories:     vi.fn().mockResolvedValue({ data: { primary_category: 'photographer' } }),
  listServiceCategories: vi.fn().mockResolvedValue({ data: { categories: [{ slug: 'portrait', name: 'Portrait' }] } }),
}));
vi.mock('../services/analytics', () => ({ analytics: { track: vi.fn() } }));
vi.mock('../utils/celebration', () => ({ fireCelebration: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { fee_only_mode: true } }) }));

import { svcCreate, markOnboardingComplete } from '../services/api';
import ExploreWithBolt from '../pages/onboarding/ExploreWithBolt';

const renderLive = () => render(
  <MemoryRouter initialEntries={['/vendor-register/me/live']}>
    <Routes>
      <Route path="/vendor-register/:slug/live" element={<ExploreWithBolt />} />
      <Route path="/dashboard" element={<div data-testid="dashboard">dash</div>} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => vi.clearAllMocks());

describe('onboarding first-service publish', () => {
  test('publishes an online service with the typed title and finishes onboarding', async () => {
    renderLive();

    const titleInput = await screen.findByPlaceholderText(/1:1 Strategy Call/i);
    fireEvent.change(titleInput, { target: { value: 'Portrait Session' } });
    fireEvent.click(screen.getByRole('button', { name: /Publish service/i }));

    await waitFor(() => expect(svcCreate).toHaveBeenCalledTimes(1));
    const payload = svcCreate.mock.calls[0][0];
    expect(payload.title).toBe('Portrait Session');
    expect(payload.meeting_mode).toBe('online');   // never trips the offline map-link wall
    expect(payload.price).toBe(0);                  // fee-only mode
    expect(payload.category).toBe('portrait');      // defaulted from the profession list

    await waitFor(() => expect(markOnboardingComplete).toHaveBeenCalled());
    await screen.findByTestId('dashboard');
  });

  test('blocks publish with no title', async () => {
    renderLive();
    await screen.findByPlaceholderText(/1:1 Strategy Call/i);
    fireEvent.click(screen.getByRole('button', { name: /Publish service/i }));
    await waitFor(() => expect(svcCreate).not.toHaveBeenCalled());
  });
});
