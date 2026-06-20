import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  adminListCategories: vi.fn(),
  adminCreateCategory: vi.fn(),
  adminUpdateCategory: vi.fn(),
  adminDeleteCategory: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import { adminListCategories, adminUpdateCategory } from '../services/api';
import AdminCategories from '../pages/admin/AdminCategories';

const ROWS = [
  { id: '1', slug: 'life-coach', label: 'Life Coach', group_label: 'Coaching & Consulting', status: 'active', registered_hosts: 4, active_services: 9, created_at: '2026-06-20T00:00:00Z' },
  { id: '2', slug: 'astrologer', label: 'Astrologer', group_label: 'Spiritual & Wellness', status: 'disabled', registered_hosts: 0, active_services: 0, created_at: '2026-06-20T00:00:00Z' },
];

beforeEach(() => {
  adminListCategories.mockResolvedValue({ data: ROWS });
  adminUpdateCategory.mockResolvedValue({ data: {} });
});

test('renders the analytics columns and counts', async () => {
  render(<AdminCategories />);
  expect(await screen.findByText('Life Coach')).toBeTruthy();
  expect(screen.getByText('Registered Hosts')).toBeTruthy();
  expect(screen.getByText('Active Services')).toBeTruthy();
  expect(screen.getByText('4')).toBeTruthy(); // registered hosts for life-coach
});

test('status dropdown flips a category off', async () => {
  render(<AdminCategories />);
  await screen.findByText('Life Coach');
  const select = screen.getAllByRole('combobox')[0];
  fireEvent.change(select, { target: { value: 'disabled' } });
  await waitFor(() => expect(adminUpdateCategory).toHaveBeenCalledWith('1', { status: 'disabled' }));
});

test('delete is disabled when hosts are registered', async () => {
  render(<AdminCategories />);
  await screen.findByText('Life Coach');
  const delBtn = screen.getByTitle(/4 hosts registered/i);
  expect(delBtn.disabled).toBe(true);
});
