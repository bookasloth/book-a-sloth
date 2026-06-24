/**
 * tests/useOnboardingGuard.test.jsx
 * Verifies the server-truth resume guard redirects hosts to the correct step.
 */
import { render, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// --- Mock api module BEFORE importing the hook ---
vi.mock('../services/api', () => ({
  getOnboardingStatus: vi.fn(),
}));

import { getOnboardingStatus } from '../services/api';
import useOnboardingGuard from '../pages/onboarding/useOnboardingGuard';

// Minimal probe component: calls the hook, reports ready state via data-testid
const Probe = ({ onNavigate }) => {
  const ready = useOnboardingGuard();
  return <div data-testid="probe" data-ready={String(ready)} />;
};

// Capture navigate calls by wrapping in MemoryRouter and spying on navigate.
// We render inside a route that provides the :slug param.
function renderInRouter(path, initialEntry) {
  const navigateCalls = [];
  // We intercept by watching the MemoryRouter's internal navigate via the
  // Routes/Route — the easiest approach in react-router v6 without mocking the
  // whole module is to mount with an initialEntries path and assert the
  // resulting location via a Location component.

  let navigateSpy = null;

  const NavigateSpy = () => {
    const { useNavigate } = require('react-router-dom');
    navigateSpy = useNavigate();
    return null;
  };

  const { getByTestId } = render(
    <MemoryRouter initialEntries={[initialEntry || path]}>
      <Routes>
        <Route path={path} element={<><NavigateSpy /><Probe /></>} />
      </Routes>
    </MemoryRouter>
  );

  return { getByTestId, navigateCalls };
}

// ─── Simpler approach: mock useNavigate so we can capture calls ─────────────
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: 'john' }),
  };
});

const mockNavigate = vi.fn();

beforeEach(() => {
  mockNavigate.mockClear();
  getOnboardingStatus.mockReset();
});

describe('useOnboardingGuard', () => {
  test('host at stepCompleted=3 visiting claim page redirects to category', async () => {
    // stepCompleted=3 → RESUME[3]='category'
    // window.location.pathname ends with 'claim' (the current page)
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 3, isComplete: false, slug: 'john' },
    });

    // Simulate current page being /vendor-register/john/claim
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, pathname: '/vendor-register/john/claim' },
    });

    const ProbeComponent = () => {
      useOnboardingGuard();
      return <div data-testid="probe" />;
    };

    render(
      <MemoryRouter initialEntries={['/vendor-register/john/claim']}>
        <Routes>
          <Route path="/vendor-register/:slug/claim" element={<ProbeComponent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/vendor-register/john/category',
        { replace: true }
      );
    });
  });

  test('host whose status isComplete is redirected to /dashboard', async () => {
    getOnboardingStatus.mockResolvedValue({
      data: { isComplete: true, stepCompleted: 6, slug: 'john' },
    });

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, pathname: '/vendor-register/john/about' },
    });

    const ProbeComponent = () => {
      useOnboardingGuard();
      return <div data-testid="probe" />;
    };

    render(
      <MemoryRouter initialEntries={['/vendor-register/john/about']}>
        <Routes>
          <Route path="/vendor-register/:slug/about" element={<ProbeComponent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  test('host on the correct step sets ready=true without redirecting', async () => {
    // stepCompleted=1 → target='claim'; current page='claim' → no redirect
    getOnboardingStatus.mockResolvedValue({
      data: { stepCompleted: 1, isComplete: false, slug: 'john' },
    });

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, pathname: '/vendor-register/john/claim' },
    });

    let capturedReady = false;
    const ProbeComponent = () => {
      const ready = useOnboardingGuard();
      capturedReady = ready;
      return <div data-testid="probe" data-ready={String(ready)} />;
    };

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/vendor-register/john/claim']}>
        <Routes>
          <Route path="/vendor-register/:slug/claim" element={<ProbeComponent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId('probe').getAttribute('data-ready')).toBe('true');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('on API error, sets ready=true so page can still render', async () => {
    getOnboardingStatus.mockRejectedValue(new Error('network error'));

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, pathname: '/vendor-register/john/claim' },
    });

    const ProbeComponent = () => {
      const ready = useOnboardingGuard();
      return <div data-testid="probe" data-ready={String(ready)} />;
    };

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/vendor-register/john/claim']}>
        <Routes>
          <Route path="/vendor-register/:slug/claim" element={<ProbeComponent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId('probe').getAttribute('data-ready')).toBe('true');
    });
  });
});
