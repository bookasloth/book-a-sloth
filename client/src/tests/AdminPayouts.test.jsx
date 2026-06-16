import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, test, expect, beforeEach } from 'vitest';
import AdminPayouts from '../pages/admin/AdminPayouts';

vi.mock('../services/api', () => ({
  adminGetPayouts: vi.fn(() => Promise.resolve({ data: [
    { id: 'p1', amount: 500, status: 'pending', created_at: '2026-06-15T10:00:00Z',
      profiles: { name: 'Asha', username: 'asha', email: 'a@x.com' } },
  ] })),
  adminApprovePayout: vi.fn(() => Promise.resolve({ data: {} })),
  adminRejectPayout: vi.fn(() => Promise.resolve({ data: {} })),
  adminMarkPayoutPaid: vi.fn(() => Promise.resolve({ data: {} })),
}));
vi.mock('react-hot-toast', () => ({ default: Object.assign(() => {}, { success: () => {}, error: () => {} }) }));

import { adminApprovePayout } from '../services/api';

beforeEach(() => vi.clearAllMocks());

test('renders a pending payout row with vendor + amount', async () => {
  render(<AdminPayouts />);
  await waitFor(() => expect(screen.getByText('Asha')).toBeInTheDocument());
  expect(screen.getByText(/500/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
});

test('approve calls the API', async () => {
  render(<AdminPayouts />);
  await waitFor(() => screen.getByRole('button', { name: 'Approve' }));
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  await waitFor(() => expect(adminApprovePayout).toHaveBeenCalledWith('p1'));
});
