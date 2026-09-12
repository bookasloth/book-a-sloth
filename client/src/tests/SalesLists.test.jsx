import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../services/api', () => ({
  crmListLists: vi.fn(() => Promise.resolve({ data: [{ id: 'L1', name: 'Topmate — cold', source: 'topmate', cold_count: 3 }] })),
  crmCreateList: vi.fn(),
  crmGetList: vi.fn(() => Promise.resolve({ data: { id: 'L1', name: 'Topmate — cold' } })),
  crmListLeads: vi.fn(() => Promise.resolve({ data: { rows: [], total: 0 } })),
  crmBulk: vi.fn(), crmImportCommit: vi.fn(),
  crmListTemplates: vi.fn(() => Promise.resolve({ data: [] })),
  crmListSequences: vi.fn(() => Promise.resolve({ data: [] })),
}));

import SalesLists from '../pages/admin/sales/SalesLists';

test('lists index renders a list card with its cold count', async () => {
  render(<MemoryRouter initialEntries={['/admin/sales/lists']}>
    <Routes><Route path="/admin/sales/lists" element={<SalesLists />} /></Routes>
  </MemoryRouter>);
  expect(await screen.findByText('Topmate — cold')).toBeTruthy();
  expect(screen.getByText(/3/)).toBeTruthy();
});
