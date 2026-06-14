import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
vi.mock('../services/api', () => ({
  getGuestBookings: vi.fn(), cancelBooking: vi.fn(), getBookingReview: vi.fn(),
}));
vi.mock('../hooks/useFeatureFlags', () => ({ default: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Sam' } }) }));
import { getGuestBookings, getBookingReview } from '../services/api';
import useFeatureFlags from '../hooks/useFeatureFlags';
import CustomerBookings from '../pages/CustomerBookings';

const upcoming = { id: 'b1', status: 'confirmed', scheduled_at: '2099-01-01T05:00:00.000Z',
  services: { title: 'Coaching', slug: 'coaching' }, 'profiles!bookings_host_id_fkey': { name: 'Pat', username: 'pat' } };
const done = { id: 'b2', status: 'completed', scheduled_at: '2000-01-01T05:00:00.000Z',
  services: { title: 'Old', slug: 'old' }, 'profiles!bookings_host_id_fkey': { name: 'Pat', username: 'pat' } };

const renderPage = () => render(<MemoryRouter><CustomerBookings /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  useFeatureFlags.mockReturnValue({ on: () => true });
});

test('upcoming shows Reschedule; completed shows Leave review + Rebook', async () => {
  getGuestBookings.mockResolvedValue({ data: [upcoming, done] });
  getBookingReview.mockResolvedValue({ data: null });
  renderPage();
  await waitFor(() => screen.getByText('Coaching'));
  expect(screen.getByRole('button', { name: /Reschedule/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Leave review/i })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /Rebook/i }).length).toBeGreaterThan(0);
});

test('reschedule hidden when flag off', async () => {
  useFeatureFlags.mockReturnValue({ on: () => false });
  getGuestBookings.mockResolvedValue({ data: [upcoming] });
  getBookingReview.mockResolvedValue({ data: null });
  renderPage();
  await waitFor(() => screen.getByText('Coaching'));
  expect(screen.queryByRole('button', { name: /Reschedule/i })).toBeNull();
});
