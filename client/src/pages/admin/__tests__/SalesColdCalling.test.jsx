import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, test, expect, afterEach } from 'vitest';

let queueCalls = 0;
const mkLead = (id, name) => ({ id, business_name: name, phone: '918888700000', whatsapp_phone: '918888700000', email: 'a@b.co', attributes: { cold_call: { day: 'Day 1' } } });
const outcome = vi.fn(() => Promise.resolve({ data: { ok: true, sends: {}, warnings: [] } }));
vi.mock('../../../services/api', () => ({
  crmListLists: () => Promise.resolve({ data: [{ id: 'L1', name: 'Test list', source: 'cold_call' }] }),
  crmColdCallQueue: () => { queueCalls += 1; return Promise.resolve({ data: {
    // From the 2nd poll on, a callback becomes due and jumps ahead of the fresh lead.
    callbacksDue: queueCalls > 1 ? [{ lead: mkLead('Z', 'Urgent Callback Co'), followUp: { id: 'fz' }, dueAt: '2000-01-01T00:00:00Z', overdue: true }] : [],
    retries: [], upcoming: [],
    fresh: [{ lead: { id: 'A', business_name: 'Test Clinic', phone: '918888700000', whatsapp_phone: '918888700000', email: 'a@b.co', profession: 'Dental clinic', attributes: { cold_call: { day: 'Day 1', priority: '1', fit: '99', locality: 'Area', pitch: 'Pitch text' } } } }],
    today: { calls: 0, connected: 0, interested: 0, followUpsSent: 0, target: 60 },
    totals: { total: 1, fresh: 1, called: 0, signedUp: 0, byOutcome: {} },
    templates: [],
  } }); },
  crmLeadTimeline: () => Promise.resolve({ data: [] }),
  crmColdCallSearch: (q) => Promise.resolve({ data: q.includes('98220') ? [mkLead('S', 'Inbound Salon')] : [] }),
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

afterEach(() => { vi.useRealTimers(); queueCalls = 0; Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });

test('a poll that reorders the queue does not swap the card mid-call', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  render(<SalesColdCalling />);
  await waitFor(() => expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0));
  const notes = screen.getByPlaceholderText('Notes from the call…');
  fireEvent.change(notes, { target: { value: 'talking to the doctor' } });
  await vi.advanceTimersByTimeAsync(61000);
  await waitFor(() => expect(screen.getAllByText('Urgent Callback Co').length).toBeGreaterThan(0));
  expect(screen.getByPlaceholderText('Notes from the call…').value).toBe('talking to the doctor');
});

test('does not poll while the tab is hidden', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  render(<SalesColdCalling />);
  await waitFor(() => expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0));
  const before = queueCalls;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  await vi.advanceTimersByTimeAsync(61000);
  expect(queueCalls).toBe(before);
});

test('first load and post-save refresh still run in a hidden tab (only the 60s poll pauses)', async () => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  render(<SalesColdCalling />);
  await waitFor(() => expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0));
  const before = queueCalls;
  fireEvent.keyDown(window, { key: '6' });
  fireEvent.keyDown(window, { key: 'Enter' });
  await waitFor(() => expect(queueCalls).toBeGreaterThan(before));
});

test('follow-up checkboxes are not stretched by the global input style', async () => {
  render(<SalesColdCalling />);
  await waitFor(() => expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0));
  fireEvent.keyDown(window, { key: '1' });
  for (const cb of screen.getAllByRole('checkbox')) expect(cb.getAttribute('class')).toContain('!w-4');
});

test('search by phone opens the lead in the call card; saving returns to the queue', async () => {
  render(<SalesColdCalling />);
  await waitFor(() => expect(screen.getAllByText('Test Clinic').length).toBeGreaterThan(0));
  expect(screen.getByText('0 / 60')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Search leads'), { target: { value: '+91 98220 11111' } });
  fireEvent.click(await screen.findByRole('button', { name: /Inbound Salon/ }));
  fireEvent.keyDown(window, { key: '1' });
  fireEvent.keyDown(window, { key: 'Enter' });
  await waitFor(() => expect(outcome).toHaveBeenCalled());
  expect(outcome.mock.calls.at(-1)[0]).toBe('S');
});
