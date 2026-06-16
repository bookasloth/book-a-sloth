import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({
  getHostBookings: vi.fn(() => Promise.resolve({ data: [] })),
  getMyServices: vi.fn(() => Promise.resolve({ data: [] })),
  getGuestBookings: vi.fn(() => Promise.resolve({ data: [] })),
}));
vi.mock('react-hot-toast', () => ({ default: Object.assign(() => {}, { success: () => {}, error: () => {} }) }));

let mockUser;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, connectGoogleCalendar: vi.fn(), updateUser: vi.fn() }),
}));

import Dashboard from '../pages/Dashboard';

const legacy = { name: 'Asha', role: 'host', plan: 'creator', subscription_status: 'active', has_payment_mandate: false };

const renderDash = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);

beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

test('shows the auto-renew banner for a legacy paid vendor (no mandate)', async () => {
  mockUser = legacy;
  renderDash();
  await waitFor(() => expect(screen.getByText(/won't auto-renew/i)).toBeInTheDocument());
  expect(screen.getByRole('link', { name: /Set up auto-renew/i })).toBeInTheDocument();
});

test('hides the banner once a mandate exists', async () => {
  mockUser = { ...legacy, has_payment_mandate: true };
  renderDash();
  await waitFor(() => screen.getByText(/Welcome back/i));
  expect(screen.queryByText(/won't auto-renew/i)).not.toBeInTheDocument();
});

test('dismiss hides the banner and persists', async () => {
  mockUser = legacy;
  renderDash();
  await waitFor(() => screen.getByText(/won't auto-renew/i));
  fireEvent.click(screen.getByLabelText('Dismiss'));
  expect(screen.queryByText(/won't auto-renew/i)).not.toBeInTheDocument();
  expect(localStorage.getItem('legacyPlanBannerDismissed')).toBe('1');
});
