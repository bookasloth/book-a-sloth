import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, test, expect, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({
  getPublicPlans: vi.fn(),
  createRazorpayOrder: vi.fn(() => Promise.resolve({ data: { skipPayment: true } })),
  createSubscription: vi.fn(() => Promise.resolve({ data: { key: 'k', subscription_id: 'sub_1' } })),
  syncSubscription: vi.fn(() => Promise.resolve({ data: {} })),
}));
vi.mock('react-hot-toast', () => ({ default: Object.assign(() => {}, { success: () => {}, error: () => {} }) }));

import { getPublicPlans, createRazorpayOrder, createSubscription } from '../services/api';
import PlansStep from '../pages/onboarding/PlansStep';

const PLANS = [
  { slug: 'starter', name: 'Starter', monthly_price: 0, annual_price: 0, limits: { services: 1, bookings_per_year: 20 }, commission_percentage: 5 },
  { slug: 'creator', name: 'Creator', monthly_price: 199, annual_price: 999, limits: { services: 5, bookings_per_year: -1 }, commission_percentage: 0 },
];

const renderStep = () => render(
  <MemoryRouter initialEntries={['/vendor-register/test/plans']}>
    <Routes><Route path="/vendor-register/:slug/plans" element={<PlansStep />} /></Routes>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  getPublicPlans.mockResolvedValue({ data: PLANS });
  window.Razorpay = vi.fn(() => ({ open: vi.fn() }));
});

test('renders DB plans + monthly/annual cadence toggle', async () => {
  renderStep();
  await waitFor(() => screen.getByText('Creator'));
  expect(screen.getByRole('button', { name: 'Monthly' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Annual/ })).toBeInTheDocument();
  expect(screen.getByText('Starter')).toBeInTheDocument();
});

test('paid plan opens an auto-renew subscription with the selected cadence', async () => {
  renderStep();
  await waitFor(() => screen.getByText('Creator'));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Creator' }));
  await waitFor(() => expect(createSubscription).toHaveBeenCalledWith({ plan: 'creator', cadence: 'annual' }));
});

test('switching to monthly passes monthly cadence', async () => {
  renderStep();
  await waitFor(() => screen.getByText('Creator'));
  fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Creator' }));
  await waitFor(() => expect(createSubscription).toHaveBeenCalledWith({ plan: 'creator', cadence: 'monthly' }));
});

test('free plan activates via the onboarding order endpoint', async () => {
  renderStep();
  await waitFor(() => screen.getByText('Starter'));
  fireEvent.click(screen.getByRole('button', { name: 'Continue Free' }));
  await waitFor(() => expect(createRazorpayOrder).toHaveBeenCalledWith({ plan: 'explorer' }));
});
