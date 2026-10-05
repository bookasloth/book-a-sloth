import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, test, expect } from 'vitest';

const outcome = vi.fn(() => Promise.resolve({ data: { ok: true, sends: {}, warnings: [] } }));
vi.mock('../../../services/api', () => ({
  crmListLists: () => Promise.resolve({ data: [{ id: 'L1', name: 'Test list', source: 'cold_call' }] }),
  crmColdCallQueue: () => Promise.resolve({ data: {
    callbacksDue: [], retries: [], upcoming: [],
    fresh: [{ lead: { id: 'A', business_name: 'Test Clinic', phone: '918888700000', whatsapp_phone: '918888700000', email: 'a@b.co', profession: 'Dental clinic', attributes: { cold_call: { day: 'Day 1', priority: '1', fit: '99', locality: 'Area', pitch: 'Pitch text' } } } }],
    today: { calls: 0, connected: 0, interested: 0, followUpsSent: 0 },
    totals: { total: 1, fresh: 1, called: 0, signedUp: 0, byOutcome: {} },
    templates: [],
  } }),
  crmLeadTimeline: () => Promise.resolve({ data: [] }),
  crmColdCallOutcome: (...a) => outcome(...a),
  crmColdCallRemind: vi.fn(), crmColdCallImport: vi.fn(), crmUpdateTemplate: vi.fn(),
}));

import SalesColdCalling from '../sales/SalesColdCalling';

test('renders the first fresh lead with its pitch and outcome buttons', async () => {
  render(<SalesColdCalling />);
  await waitFor(() => expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0));
  expect(screen.getByText('Pitch text')).toBeTruthy();
  expect(screen.getByText('+91 88887 00000')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Interested/ })).toBeTruthy();
});

test('hotkey 6 picks No answer and Enter saves it', async () => {
  render(<SalesColdCalling />);
  await waitFor(() => expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0));
  fireEvent.keyDown(window, { key: '6' });
  fireEvent.keyDown(window, { key: 'Enter' });
  await waitFor(() => expect(outcome).toHaveBeenCalled());
  expect(outcome.mock.calls[0][0]).toBe('A');
  expect(outcome.mock.calls[0][1]).toMatchObject({ outcome: 'no_answer' });
});
