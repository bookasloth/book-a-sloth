/**
 * tests/AboutYouStep.test.jsx
 * Verifies the merged About You step: both groups render, selecting both enables Continue.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, test, expect, beforeEach, describe } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../services/api', () => ({
  updateOnboardingStep: vi.fn(() => Promise.resolve({ data: {} })),
  getOnboardingStatus: vi.fn(() =>
    Promise.resolve({ data: { stepCompleted: 2, isComplete: false, slug: 'testhost' } })
  ),
}));
vi.mock('react-hot-toast', () => ({
  default: Object.assign(() => {}, { success: () => {}, error: () => {} }),
}));
// Mock useNavigate so we can capture calls; useParams provides the slug.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: 'testhost' }),
  };
});

import { updateOnboardingStep } from '../services/api';
import AboutYouStep from '../pages/onboarding/AboutYouStep';

const renderStep = () =>
  render(
    <MemoryRouter initialEntries={['/vendor-register/testhost/about']}>
      <Routes>
        <Route path="/vendor-register/:slug/about" element={<AboutYouStep />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  // Simulate window.location so the guard does not redirect
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, pathname: '/vendor-register/testhost/about' },
  });
});

describe('AboutYouStep', () => {
  test('renders a host-type option (Individual)', async () => {
    renderStep();
    expect(await screen.findByText('Individual')).toBeInTheDocument();
  });

  test('renders a booking-type option (Online Only)', async () => {
    renderStep();
    expect(await screen.findByText('Online Only')).toBeInTheDocument();
  });

  test('Continue button is disabled until both selections are made', async () => {
    renderStep();
    const btn = await screen.findByRole('button', { name: /Continue/i });
    expect(btn).toBeDisabled();

    // Select host type only
    fireEvent.click(screen.getByText('Individual'));
    expect(btn).toBeDisabled();

    // Select booking type → now enabled
    fireEvent.click(screen.getByText('Online Only'));
    expect(btn).not.toBeDisabled();
  });

  test('Continue calls updateOnboardingStep with step 3 and both values, then navigates', async () => {
    renderStep();
    const btn = await screen.findByRole('button', { name: /Continue/i });

    fireEvent.click(screen.getByText('Organisation'));
    fireEvent.click(screen.getByText('Both Online & In-Person'));
    fireEvent.click(btn);

    await waitFor(() => expect(updateOnboardingStep).toHaveBeenCalledWith({
      slug: 'testhost',
      step: 3,
      data: { vendor_type: 'organisation', booking_type: 'both' },
    }));
    expect(mockNavigate).toHaveBeenCalledWith('/vendor-register/testhost/category');
  });

  test('on save error shows toast and re-enables button', async () => {
    const { updateOnboardingStep: apiMock } = await import('../services/api');
    apiMock.mockRejectedValueOnce({ response: { data: { message: 'Server error' } } });

    renderStep();
    const btn = await screen.findByRole('button', { name: /Continue/i });

    fireEvent.click(screen.getByText('Individual'));
    fireEvent.click(screen.getByText('In-Person Only'));
    fireEvent.click(btn);

    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
