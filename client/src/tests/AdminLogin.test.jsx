/**
 * tests/AdminLogin.test.jsx
 * Single-step admin login UI — username/email + password (credential store), no OTP.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminLogin from '../pages/AdminLogin';

// Mock API calls
vi.mock('../services/api', () => ({
  adminLoginUser: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { adminLoginUser } from '../services/api';

const ADMIN_SESSION = { token: 'adm-tok', type: 'admin', role: 'super', name: 'Super Admin', username: 'superadmin', email: 'superadmin@bookasloth.com', permissions: ['*'] };

const renderComponent = () =>
  render(<MemoryRouter><AdminLogin /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AdminLogin — single step', () => {
  test('renders username and password fields', () => {
    renderComponent();
    expect(screen.getByLabelText(/username/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  test('has no two-step / OTP UI', () => {
    renderComponent();
    expect(screen.queryByText(/step 1 of 2/i)).toBeNull();
    expect(screen.queryByText(/step 2 of 2/i)).toBeNull();
    expect(screen.queryByPlaceholderText('000000')).toBeNull();
  });

  test('calls adminLoginUser with identifier + password on submit', async () => {
    adminLoginUser.mockResolvedValueOnce({ data: ADMIN_SESSION });
    renderComponent();
    await userEvent.type(screen.getByLabelText(/username/i), 'superadmin');
    await userEvent.type(screen.getByLabelText(/password/i), 'Sloth$Super#2026');
    fireEvent.submit(screen.getByRole('button', { name: /grant access/i }));
    await waitFor(() =>
      expect(adminLoginUser).toHaveBeenCalledWith({ identifier: 'superadmin', password: 'Sloth$Super#2026' })
    );
  });

  test('stores session under bas_admin (never the user key) and navigates', async () => {
    adminLoginUser.mockResolvedValueOnce({ data: ADMIN_SESSION });
    renderComponent();
    await userEvent.type(screen.getByLabelText(/username/i), 'superadmin');
    await userEvent.type(screen.getByLabelText(/password/i), 'Sloth$Super#2026');
    await userEvent.click(screen.getByRole('button', { name: /grant access/i }));
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('bas_admin') || 'null');
      expect(stored?.role).toBe('super');
      expect(stored?.token).toBe('adm-tok');
      // Must NOT overwrite the regular user session
      expect(localStorage.getItem('user')).toBeNull();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/super-dashboard');
  });

  test('shows error toast on bad credentials', async () => {
    const toast = await import('react-hot-toast');
    adminLoginUser.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials.' } } });
    renderComponent();
    await userEvent.type(screen.getByLabelText(/username/i), 'superadmin');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /grant access/i }));
    await waitFor(() => expect(toast.default.error).toHaveBeenCalled());
    expect(localStorage.getItem('bas_admin')).toBeNull();
  });
});
