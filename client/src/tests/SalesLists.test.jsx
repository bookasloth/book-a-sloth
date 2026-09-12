import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../services/api', () => ({
  crmListLists: vi.fn(() => Promise.resolve({ data: [{ id: 'L1', name: 'Topmate — cold', source: 'topmate', cold_count: 3 }] })),
  crmCreateList: vi.fn(),
  crmGetList: vi.fn(() => Promise.resolve({ data: { id: 'L1', name: 'Topmate — cold', source: 'topmate' } })),
  crmListLeads: vi.fn(() => Promise.resolve({ data: { rows: [{ id: 'x1', name: 'Ada', email: 'a@b.com', tags: [] }], total: 1 } })),
  crmBulk: vi.fn(), crmImportCommit: vi.fn(),
}));
// Stub the drawer so the row-click test doesn't mount the full LeadPanel.
vi.mock('../pages/admin/sales/LeadDrawer', () => ({ default: ({ leadId }) => (leadId ? <div>drawer-open:{leadId}</div> : null) }));

import SalesLists from '../pages/admin/sales/SalesLists';

test('lists index renders a list card with its cold count', async () => {
  render(<MemoryRouter initialEntries={['/admin/sales/lists']}>
    <Routes><Route path="/admin/sales/lists" element={<SalesLists />} /></Routes>
  </MemoryRouter>);
  expect(await screen.findByText('Topmate — cold')).toBeTruthy();
  expect(screen.getByText(/3/)).toBeTruthy();
});

test('clicking a contact row opens the lead drawer', async () => {
  render(<MemoryRouter initialEntries={['/admin/sales/lists/L1']}>
    <Routes><Route path="/admin/sales/lists/:id" element={<SalesLists />} /></Routes>
  </MemoryRouter>);
  fireEvent.click(await screen.findByText('Ada'));
  expect(await screen.findByText('drawer-open:x1')).toBeTruthy();
});
