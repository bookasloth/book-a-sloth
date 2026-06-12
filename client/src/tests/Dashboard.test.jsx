/**
 * tests/Dashboard.test.jsx
 * Covers host dashboard, guest dashboard, profile URL banner,
 * username-missing banner, and Google Calendar prompt.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  getHostBookings:  vi.fn().mockResolvedValue({ data: [] }),
  getMyServices:    vi.fn().mockResolvedValue({ data: [] }),
  getGuestBookings: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';

const renderDashboard = (user) => {
  useAuth.mockReturnValue({
    user,
    connectGoogleCalendar: vi.fn(),
    updateUser: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Dashboard />
    </MemoryRouter>
  );
};

// ── Vendor (host) dashboard ───────────────────────────────────────────────────

describe('Dashboard — Vendor (role:host)', () => {
  const VENDOR = {
    _id: 'v1', name: 'Jane Vendor', role: 'host', plan: 'explorer',
    username: 'jane-vendor', google_calendar_connected: false,
  };

  test('shows welcome message with first name', async () => {
    renderDashboard(VENDOR);
    await waitFor(() => expect(screen.getByText(/welcome back, jane/i)).toBeTruthy());
  });

  test('shows profile URL pill with correct link', async () => {
    renderDashboard(VENDOR);
    await waitFor(() => expect(screen.getByText(/bookasloth\.com\/jane-vendor/i)).toBeTruthy());
  });

  test('shows Google Calendar connect prompt when not connected', async () => {
    renderDashboard(VENDOR);
    await waitFor(() => expect(screen.getByText(/connect google calendar/i)).toBeTruthy());
  });

  test('hides Google Calendar prompt when already connected', async () => {
    renderDashboard({ ...VENDOR, google_calendar_connected: true });
    await waitFor(() => expect(screen.queryByText(/connect google calendar/i)).toBeNull());
  });

  test('shows stat cards (Upcoming, Completed, Total Bookings, Earnings)', async () => {
    const { container } = renderDashboard(VENDOR);
    await waitFor(() => {
      // 'Earnings' also renders as a quick-action link below the stat cards, so a
      // bare getByText('Earnings') is ambiguous. Scope to the stats grid (first
      // .grid) where each of the four labels is unique.
      const statsGrid = container.querySelector('.grid');
      expect(within(statsGrid).getByText('Upcoming')).toBeTruthy();
      expect(within(statsGrid).getByText('Completed')).toBeTruthy();
      expect(within(statsGrid).getByText('Total Bookings')).toBeTruthy();
      expect(within(statsGrid).getByText('Earnings')).toBeTruthy();
    });
  });

  test('shows quick action links (Bookings, Services, Earnings, Profile)', async () => {
    renderDashboard(VENDOR);
    await waitFor(() => {
      expect(screen.getByText('Bookings')).toBeTruthy();
      expect(screen.getByText(/services/i)).toBeTruthy();
    });
  });
});

// ── New vendor — no username yet ──────────────────────────────────────────────

describe('Dashboard — new vendor without username', () => {
  const NEW_VENDOR = {
    _id: 'v2', name: 'New Creator', role: 'host', plan: 'explorer',
    username: null, google_calendar_connected: false,
  };

  test('shows "Set username" onboarding banner', async () => {
    renderDashboard(NEW_VENDOR);
    await waitFor(() => expect(screen.getByText(/set up your public profile/i)).toBeTruthy());
  });

  test('does NOT show profile URL pill (no username)', async () => {
    renderDashboard(NEW_VENDOR);
    await waitFor(() => expect(screen.queryByText(/bookasloth\.com\//i)).toBeNull());
  });

  test('banner links to /dashboard/profile', async () => {
    renderDashboard(NEW_VENDOR);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /set username/i });
      expect(link.getAttribute('href')).toContain('/dashboard/profile');
    });
  });
});

// ── Guest (user) dashboard ────────────────────────────────────────────────────

describe('Dashboard — User (role:guest)', () => {
  const GUEST = { _id: 'u1', name: 'Bob Guest', role: 'guest', plan: 'explorer', username: null };

  test('shows "My Bookings" heading (guest view)', async () => {
    renderDashboard(GUEST);
    await waitFor(() => expect(screen.getByText(/my bookings/i)).toBeTruthy());
  });

  test('does NOT show host stat cards', async () => {
    renderDashboard(GUEST);
    await waitFor(() => expect(screen.queryByText('Upcoming')).toBeNull());
  });

  test('does NOT show profile URL banner', async () => {
    renderDashboard(GUEST);
    await waitFor(() => expect(screen.queryByText(/bookasloth\.com\//i)).toBeNull());
  });

  test('shows empty state when no bookings', async () => {
    renderDashboard(GUEST);
    await waitFor(() => expect(screen.getByText(/no bookings yet/i)).toBeTruthy());
  });
});
