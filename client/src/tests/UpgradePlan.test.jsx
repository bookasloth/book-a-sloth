/**
 * tests/UpgradePlan.test.jsx
 * Vitest: plan-card CTAs are tier-aware. A higher tier than the current plan
 * reads "Upgrade to …", a lower tier reads "Downgrade to …", and the current
 * tier reads "Current Plan" / "Switch to <cadence>". Guards the regression
 * where a Professional user was offered the lower Creator tier as an "Upgrade".
 */
import { render, screen, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  getPublicPlans: vi.fn(),
  createSubscription: vi.fn(),
  syncSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../components/common/BackButton', () => ({ default: () => <div>Back</div> }));

import { useAuth } from '../context/AuthContext';
import { getPublicPlans } from '../services/api';
import UpgradePlan from '../pages/UpgradePlan';

// Annual prices so paid plans render a clickable CTA (annual is the default cadence).
const PLANS = [
  { id: '1', slug: 'starter',      name: 'Starter',      sort_order: 1, annual_price: 0,    monthly_price: 0,   limits: { digital_products: 3 } },
  { id: '2', slug: 'creator',      name: 'Creator',      sort_order: 2, annual_price: 999,  monthly_price: 199, limits: { digital_products: 10 } },
  { id: '3', slug: 'professional', name: 'Professional', sort_order: 3, annual_price: 3650, monthly_price: 0,   limits: { digital_products: 20 } },
];

beforeEach(() => {
  vi.clearAllMocks();
  getPublicPlans.mockResolvedValue({ data: PLANS });
});

const renderFor = async (plan) => {
  useAuth.mockReturnValue({ user: { plan }, updateUser: vi.fn() });
  render(<MemoryRouter><UpgradePlan /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText('Professional')).toBeTruthy());
};

describe('UpgradePlan — tier-aware CTAs', () => {
  test('Professional sees the lower Creator tier as a downgrade, not an upgrade', async () => {
    await renderFor('professional');
    expect(screen.getByRole('button', { name: /downgrade to creator/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /upgrade to creator/i })).toBeNull();
  });

  test('Professional sees its own tier as the current plan', async () => {
    await renderFor('professional');
    expect(screen.getAllByText('Current Plan').length).toBeGreaterThan(0);
  });

  test('Starter sees higher tiers as upgrades', async () => {
    await renderFor('starter');
    expect(screen.getByRole('button', { name: /upgrade to creator/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /upgrade to professional/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /downgrade/i })).toBeNull();
  });

  test('legacy "explorer" alias is treated as the free starter tier (all paid plans are upgrades)', async () => {
    await renderFor('explorer');
    expect(screen.getByRole('button', { name: /upgrade to creator/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /upgrade to professional/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /downgrade/i })).toBeNull();
  });
});
