import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, test, expect, beforeEach, describe } from 'vitest';

vi.mock('../services/api', () => ({
  getPublicPlans: vi.fn(),
  activateFreePlan: vi.fn(() => Promise.resolve({ data: {} })),
  advanceToLive: vi.fn(() => Promise.resolve({ data: {} })),
  createSubscription: vi.fn(() => Promise.resolve({ data: { key: 'k', subscription_id: 'sub_1' } })),
  syncSubscription: vi.fn(() => Promise.resolve({ data: {} })),
  getMe: vi.fn(() =>
    Promise.resolve({ data: { name: 'Test Host', email: 'host@example.com', plan: 'creator' } })
  ),
  // useOnboardingGuard: stepCompleted=6 → RESUME[6]=undefined → target=null → no redirect
  getOnboardingStatus: vi.fn(() =>
    Promise.resolve({ data: { stepCompleted: 6, isComplete: false, slug: 'test' } })
  ),
}));
vi.mock('react-hot-toast', () => ({ default: Object.assign(() => {}, { success: () => {}, error: () => {} }) }));

import {
  getPublicPlans,
  activateFreePlan,
  advanceToLive,
  createSubscription,
  syncSubscription,
  getMe,
} from '../services/api';
import PlansStep from '../pages/onboarding/PlansStep';

const PLANS = [
  { slug: 'starter', name: 'Starter', monthly_price: 0, annual_price: 0, limits: { services: 1, bookings_per_year: 20 }, commission_percentage: 5 },
  { slug: 'creator', name: 'Creator', monthly_price: 199, annual_price: 999, limits: { services: 5, bookings_per_year: -1 }, commission_percentage: 0 },
];

// Render the plans step alongside a sentinel /live route so we can assert navigation.
const renderStep = () => render(
  <MemoryRouter initialEntries={['/vendor-register/test/plans']}>
    <Routes>
      <Route path="/vendor-register/:slug/plans" element={<PlansStep />} />
      <Route path="/vendor-register/:slug/live" element={<div data-testid="live-page">live</div>} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  getPublicPlans.mockResolvedValue({ data: PLANS });
  getMe.mockResolvedValue({ data: { name: 'Test Host', email: 'host@example.com', plan: 'creator' } });
  // Use a function (not arrow) so `new window.Razorpay(opts)` works as a constructor.
  window.Razorpay = function () { return { open: vi.fn() }; };
  // Guard checks window.location.pathname for the current segment.
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, pathname: '/vendor-register/test/plans' },
  });
});

test('renders DB plans + monthly/annual cadence toggle', async () => {
  renderStep();
  await waitFor(() => screen.getByText('Starter'));
  fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
  await waitFor(() => screen.getByText('Host+'));
  expect(screen.getByRole('button', { name: 'Monthly' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Annual/ })).toBeInTheDocument();
  expect(screen.getByText('Starter')).toBeInTheDocument();
});

test('paid plan opens an auto-renew subscription with the selected cadence', async () => {
  renderStep();
  await waitFor(() => screen.getByText('Starter'));
  fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
  await waitFor(() => screen.getByText('Host+'));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Host+' }));
  await waitFor(() => expect(createSubscription).toHaveBeenCalledWith({ plan: 'creator', cadence: 'annual' }));
});

test('switching to monthly passes monthly cadence', async () => {
  renderStep();
  await waitFor(() => screen.getByText('Starter'));
  fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
  await waitFor(() => screen.getByText('Host+'));
  fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose Host+' }));
  await waitFor(() => expect(createSubscription).toHaveBeenCalledWith({ plan: 'creator', cadence: 'monthly' }));
});

describe('free plan path', () => {
  test('calls activateFreePlan then navigates to /live', async () => {
    renderStep();
    await waitFor(() => screen.getByText('Starter'));
    fireEvent.click(screen.getByRole('button', { name: 'Publish free' }));
    await waitFor(() => expect(activateFreePlan).toHaveBeenCalled());
    // After navigation the /live sentinel route renders
    await waitFor(() => expect(screen.getByTestId('live-page')).toBeInTheDocument());
  });

  test('does NOT call advanceToLive or markOnboardingComplete on free path', async () => {
    renderStep();
    await waitFor(() => screen.getByText('Starter'));
    fireEvent.click(screen.getByRole('button', { name: 'Publish free' }));
    await waitFor(() => expect(activateFreePlan).toHaveBeenCalled());
    // Navigates but does NOT call advanceToLive (activate-free handles step advance server-side)
    expect(advanceToLive).not.toHaveBeenCalled();
  });
});

describe('paid plan success path', () => {
  // Helper: installs a window.Razorpay constructor that captures the options object.
  const makeRazorpayCapture = () => {
    let captured = null;
    window.Razorpay = function RazorpayMock(opts) {
      captured = opts;
      return { open: vi.fn() };
    };
    return () => captured;
  };

  test('handler calls syncSubscription → getMe → advanceToLive → navigate /live when plan is active', async () => {
    const getCapture = makeRazorpayCapture();
    // Both mount + handler getMe calls return a paid plan
    getMe.mockResolvedValue({ data: { name: 'Test Host', email: 'host@example.com', plan: 'creator' } });

    renderStep();
    await waitFor(() => screen.getByText('Starter'));
    fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
    await waitFor(() => screen.getByText('Host+'));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Host+' }));
    await waitFor(() => expect(createSubscription).toHaveBeenCalled());

    const opts = getCapture();
    expect(opts?.handler).toBeTypeOf('function');

    // Simulate Razorpay success callback
    await act(async () => {
      await opts.handler();
    });

    expect(syncSubscription).toHaveBeenCalled();
    // getMe called at least twice: once on mount, once in handler
    expect(getMe).toHaveBeenCalledTimes(2);
    expect(advanceToLive).toHaveBeenCalled();
    // /live page renders after navigation
    await waitFor(() => expect(screen.getByTestId('live-page')).toBeInTheDocument());
  });

  test('handler does NOT navigate or call advanceToLive when getMe shows plan not yet active (webhook lag)', async () => {
    const getCapture = makeRazorpayCapture();
    // Both mount and handler getMe calls return no/free plan → webhook lag scenario
    getMe.mockResolvedValue({ data: { name: 'Test Host', email: 'host@example.com', plan: null } });

    renderStep();
    await waitFor(() => screen.getByText('Starter'));
    fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
    await waitFor(() => screen.getByText('Host+'));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Host+' }));
    await waitFor(() => expect(createSubscription).toHaveBeenCalled());

    const opts = getCapture();
    await act(async () => {
      await opts.handler();
    });

    expect(syncSubscription).toHaveBeenCalled();
    expect(advanceToLive).not.toHaveBeenCalled();
    // Still on plans page — live page NOT rendered
    expect(screen.queryByTestId('live-page')).toBeNull();
  });

  test('handler does NOT navigate or call advanceToLive when getMe ERRORS after payment (transient failure)', async () => {
    const getCapture = makeRazorpayCapture();
    // Mount getMe resolves (so the page renders); the post-payment getMe rejects.
    getMe
      .mockResolvedValueOnce({ data: { name: 'Test Host', email: 'host@example.com', plan: 'creator' } })
      .mockRejectedValue(new Error('network'));

    renderStep();
    await waitFor(() => screen.getByText('Starter'));
    fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
    await waitFor(() => screen.getByText('Host+'));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Host+' }));
    await waitFor(() => expect(createSubscription).toHaveBeenCalled());

    const opts = getCapture();
    await act(async () => {
      await opts.handler();
    });

    // A transient getMe error must NOT be treated as success: no optimistic advance…
    expect(advanceToLive).not.toHaveBeenCalled();
    // …and no optimistic navigation to /live.
    expect(screen.queryByTestId('live-page')).toBeNull();
  });

  test('Razorpay options include modal.ondismiss', async () => {
    const getCapture = makeRazorpayCapture();

    renderStep();
    await waitFor(() => screen.getByText('Starter'));
    fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
    await waitFor(() => screen.getByText('Host+'));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Host+' }));
    await waitFor(() => expect(createSubscription).toHaveBeenCalled());

    const opts = getCapture();
    expect(opts?.modal?.ondismiss).toBeTypeOf('function');
  });

  test('paid handler does NOT call markOnboardingComplete (only navigates to /live via advanceToLive)', async () => {
    const getCapture = makeRazorpayCapture();
    getMe.mockResolvedValue({ data: { name: 'Test Host', email: 'host@example.com', plan: 'creator' } });

    renderStep();
    await waitFor(() => screen.getByText('Starter'));
    fireEvent.click(screen.getByRole('button', { name: /See Host\+ and Studio/ }));
    await waitFor(() => screen.getByText('Host+'));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Host+' }));
    await waitFor(() => expect(createSubscription).toHaveBeenCalled());

    const opts = getCapture();
    await act(async () => {
      await opts.handler();
    });

    expect(advanceToLive).toHaveBeenCalled();
    // markOnboardingComplete is NOT in the mock → confirm /live is reached, not /dashboard
    await waitFor(() => expect(screen.getByTestId('live-page')).toBeInTheDocument());
  });
});
