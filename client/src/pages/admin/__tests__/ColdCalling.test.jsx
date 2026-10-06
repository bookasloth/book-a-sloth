import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, test, expect, afterEach } from 'vitest';

let queueCalls = 0;
const cc = (x = {}) => ({ cold_call: { list_id: 'L1', priority: 'P1', fit: '91', locality: 'Dhantoli', ...x } });
const LEADS = {
  A: { id: 'A', business_name: 'Bloom Makeup Studio', phone: '918888700001', whatsapp_phone: '918888700001', email: null, profession: 'Make-up artist', attributes: cc({ rating: '4.6', reviews: '212', maps_url: 'javascript:alert(1)' }) },
  B: { id: 'B', business_name: 'Sunrise Dental Care', phone: '918888700002', whatsapp_phone: '918888700002', email: 'dr@sun.co', profession: 'Dental clinic', attributes: cc() },
  D: { id: 'D', business_name: 'Done Clinic', phone: '918888700003', whatsapp_phone: '918888700003', profession: 'Clinic', attributes: cc({ attempts: 1, last_outcome: 'interested' }) },
};
const TPL = [
  { id: 'te', channel: 'email', category: 'cold_call_interested', subject: 'Your booking page', body: '<p>Hi {{business_name}} team,</p><p><a href="https://x">Create</a></p>', is_active: true },
  { id: 'tw', channel: 'whatsapp', category: 'cold_call_interested', body: 'Hi {{1}} team, link here', is_active: false },
  { id: 'te2', channel: 'email', category: 'cold_call_missed', subject: 'Tried calling', body: '<p>Hi</p>', is_active: true },
];
const outcome = vi.fn(() => Promise.resolve({ data: { ok: true, coldCall: { attempts: 1, no_answers: 0 }, sends: {}, warnings: [] } }));
const send = vi.fn(() => Promise.resolve({ data: { ok: true, sends: { email: { status: 'sent' } } } }));
const details = vi.fn((id, d) => Promise.resolve({ data: { ...LEADS[id], ...d } }));
vi.mock('../../../services/api', () => ({
  crmListLists: () => Promise.resolve({ data: [{ id: 'L1', name: 'Test list', source: 'cold_call' }] }),
  crmColdCallQueue: () => { queueCalls += 1; return Promise.resolve({ data: {
    callbacksDue: [], retries: [], upcoming: [],
    fresh: [{ lead: LEADS.A }, { lead: LEADS.B }],
    done: [{ lead: LEADS.D, outcome: 'interested', at: '2026-10-06T04:40:00Z' }],
    today: { calls: 1, connected: 1, interested: 1, followUpsSent: 0, target: 60 },
    totals: { fresh: 8948, signedUp: 0 },
    templates: TPL,
  } }); },
  crmGetLead: (id) => Promise.resolve({ data: { lead: LEADS[id], notes: [], followUps: [] } }),   // real API shape
  crmLeadTimeline: () => Promise.resolve({ data: [] }),
  crmColdCallOutcome: (...a) => outcome(...a),
  crmColdCallSend: (...a) => send(...a),
  crmColdCallDetails: (...a) => details(...a),
  crmColdCallSearch: () => Promise.resolve({ data: [LEADS.B] }),
  crmColdCallStats: () => Promise.resolve({ data: {
    days: 7, calls: 12, connected: 5, interested: 2, signedUp: 1, followUpsSent: 3,
    byOutcome: { interested: 2, no_answer: 7, details: 3 }, objections: [{ label: 'Price', n: 2 }],
    followUps: { overdue: 2, today: 1, tomorrow: 0, later: 0, next: [{ leadId: 'B', name: 'Sunrise Dental Care', dueAt: '2026-10-06T05:00:00Z', title: 'Callback: after 11' }] },
    lists: [{ id: 'L1', name: 'Test list', total: 360, fresh: 300, interested: 4 }],
  } }),
  crmColdCallRemind: vi.fn(() => Promise.resolve({ data: {} })), crmColdCallImport: vi.fn(), crmUpdateTemplate: vi.fn(),
}));

import ColdCallingLayout from '../sales/ColdCallingLayout';
import ColdCallOverview from '../sales/ColdCallOverview';
import ColdCallToday from '../sales/ColdCallToday';
import ColdCallLead from '../sales/ColdCallLead';

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/admin/sales/cold-calling" element={<ColdCallingLayout />}>
        <Route index element={<ColdCallOverview />} />
        <Route path="today" element={<ColdCallToday />} />
        <Route path="lead/:leadId" element={<ColdCallLead />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);
const onLead = (name) => waitFor(() => expect(screen.getByRole('heading', { name })).toBeTruthy());

afterEach(() => { vi.useRealTimers(); queueCalls = 0; vi.clearAllMocks(); Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });

test('overview: today numbers, attention, week stats, lists; Start calling opens the first lead', async () => {
  renderAt('/admin/sales/cold-calling');
  await waitFor(() => expect(screen.getByText('1 / 60')).toBeTruthy());
  await waitFor(() => expect(screen.getByText('2 overdue callbacks')).toBeTruthy());
  expect(screen.getByText('Price')).toBeTruthy();
  expect(screen.getByText(/360 · 60 called · 4 interested/)).toBeTruthy();
  expect(screen.queryByText('Done Clinic')).toBeNull();          // the list lives on /today
  fireEvent.click(screen.getByRole('button', { name: /Start calling/ }));
  await onLead('Bloom Makeup Studio');
});

test("today's calls is the list only: done + pending in order", async () => {
  renderAt('/admin/sales/cold-calling/today');
  await waitFor(() => expect(screen.getAllByText('Bloom Makeup Studio').length).toBeGreaterThan(0));
  expect(screen.getByText('Done Clinic')).toBeTruthy();
  expect(screen.queryByText('Planned today')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Start calling/ }));
  await onLead('Bloom Makeup Studio');
});

test('save → follow-up window pre-picked for the outcome → send → next lead', async () => {
  renderAt('/admin/sales/cold-calling/lead/A');
  await onLead('Bloom Makeup Studio');
  fireEvent.keyDown(window, { key: '1' });
  fireEvent.keyDown(window, { key: 'Enter' });
  const dialog = await screen.findByRole('dialog', { name: 'Send follow-up' });
  expect(outcome.mock.calls[0][0]).toBe('A');
  expect(outcome.mock.calls[0][1]).toMatchObject({ outcome: 'interested' });
  // WhatsApp template not approved yet → unticked; email needs an address → type it.
  expect(within(dialog).getByText('Waiting for Meta approval')).toBeTruthy();
  fireEvent.change(within(dialog).getByPlaceholderText('name@business.com'), { target: { value: 'owner@bloom.co' } });
  fireEvent.click(within(dialog).getByRole('button', { name: /Send 1 & next lead/ }));
  await waitFor(() => expect(send).toHaveBeenCalled());
  expect(send.mock.calls[0][1]).toMatchObject({ email: { category: 'cold_call_interested' }, whatsapp: null, toEmail: 'owner@bloom.co' });
  await onLead('Sunrise Dental Care');
});

test('not interested skips the window and goes straight to the next lead', async () => {
  renderAt('/admin/sales/cold-calling/lead/A');
  await onLead('Bloom Makeup Studio');
  fireEvent.keyDown(window, { key: '5' });
  fireEvent.keyDown(window, { key: 'Enter' });
  await onLead('Sunrise Dental Care');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('details typed during the call are saved; unsafe Maps links are not rendered; no page header', async () => {
  renderAt('/admin/sales/cold-calling/lead/A');
  await onLead('Bloom Makeup Studio');
  expect(screen.queryByRole('button', { name: 'Upload CSV' })).toBeNull();
  expect(screen.queryByLabelText('Calling list')).toBeNull();
  expect(screen.queryByText(/View on Maps/)).toBeNull();
  expect(screen.getByText('4.6 ★')).toBeTruthy();
  fireEvent.change(screen.getByPlaceholderText('Owner / Manager / Reception'), { target: { value: 'Owner' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
  await waitFor(() => expect(details).toHaveBeenCalledWith('A', { role: 'Owner' }));
});

test('search opens the lead page', async () => {
  renderAt('/admin/sales/cold-calling/today');
  await waitFor(() => expect(screen.getAllByText('Bloom Makeup Studio').length).toBeGreaterThan(0));
  fireEvent.change(screen.getByLabelText('Search leads'), { target: { value: '98220 00002' } });
  fireEvent.click(await screen.findByRole('button', { name: /Sunrise Dental Care/ }));
  await onLead('Sunrise Dental Care');
});

test('does not poll while the tab is hidden', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  renderAt('/admin/sales/cold-calling/today');
  await waitFor(() => expect(screen.getAllByText('Bloom Makeup Studio').length).toBeGreaterThan(0));
  const before = queueCalls;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  await vi.advanceTimersByTimeAsync(61000);
  expect(queueCalls).toBe(before);
});
