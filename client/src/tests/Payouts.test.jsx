import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Payouts from '../pages/Payouts';

vi.mock('../services/api', () => ({
  getPayoutBalance: vi.fn(() => Promise.resolve({ data: {
    available: 900, clearing: 300, pendingCompletion: 200, inflight: 0, paidOut: 100, lifetimeEarned: 1400,
  } })),
  getPayoutRequests: vi.fn(() => Promise.resolve({ data: [] })),
  requestPayout: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

describe('Payouts breakdown', () => {
  it('shows available, clearing and pending-completion figures', async () => {
    render(<Payouts />);
    // Exact string (not /i regex): the StatCard label is "Available Balance";
    // a hint sentence also contains "available balance" lowercase, so a loose
    // regex matches multiple elements. Scope to the KPI tile label.
    await waitFor(() => expect(screen.getByText('Available Balance')).toBeInTheDocument());
    expect(screen.getByText('₹900.00')).toBeInTheDocument();
    expect(screen.getByText(/Clearing/i)).toBeInTheDocument();
    expect(screen.getByText('₹300.00')).toBeInTheDocument();
    expect(screen.getByText(/Pending Completion/i)).toBeInTheDocument();
    expect(screen.getByText('₹200.00')).toBeInTheDocument();
  });
});
