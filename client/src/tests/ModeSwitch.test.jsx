import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect } from 'vitest';

let mockUser;
const mockMode = 'traveling';
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, mode: mockMode, setMode: vi.fn() }),
}));

import ModeSwitch from '../components/common/ModeSwitch';

const at = () => render(<MemoryRouter><ModeSwitch /></MemoryRouter>);

test('renders the Hosting/Traveling toggle for a host', () => {
  mockUser = { is_host: true };
  at();
  expect(screen.getByRole('button', { name: /hosting/i })).toBeTruthy();
  expect(screen.getByRole('button', { name: /traveling/i })).toBeTruthy();
});

test('renders nothing for a non-host', () => {
  mockUser = { is_host: false, role: 'guest' };
  const { container } = at();
  expect(container.firstChild).toBeNull();
});
