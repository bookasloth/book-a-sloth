import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import SupportChat from '../components/chat/SupportChat';

// Realtime client — a no-op channel that chains .on().subscribe().
vi.mock('../services/supabaseClient', () => ({
  getSupabase: vi.fn(() => Promise.resolve({
    channel: () => { const c = { on: () => c, subscribe: () => c }; return c; },
    removeChannel: vi.fn(),
  })),
}));

vi.mock('../services/api', () => ({
  getSupportThread: vi.fn(() => Promise.resolve({ data: {
    thread: { id: 't1', status: 'bot' },
    messages: [{ id: 'm1', sender: 'bot', body: 'Hi, I am Bolt', created_at: '2026-08-25T10:00:00Z' }],
  } })),
  sendSupportMessage: vi.fn((id, { body }) => Promise.resolve({ data: { id: 'm2', sender: 'user', body, created_at: '2026-08-25T10:01:00Z' } })),
  escalateSupport: vi.fn(() => Promise.resolve({ data: { thread: { id: 't1', status: 'waiting' } } })),
  markSupportRead: vi.fn(() => Promise.resolve({})),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

import { sendSupportMessage, escalateSupport } from '../services/api';

beforeAll(() => { window.HTMLElement.prototype.scrollIntoView = vi.fn(); });

describe('SupportChat', () => {
  it('loads the thread and shows the Bolt message + the "Talk to a human" action', async () => {
    render(<SupportChat />);
    await waitFor(() => expect(screen.getByText('Hi, I am Bolt')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /talk to a human/i })).toBeInTheDocument();
  });

  it('sends a message and appends it', async () => {
    render(<SupportChat />);
    await waitFor(() => expect(screen.getByText('Hi, I am Bolt')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'my payout is late' } });
    fireEvent.click(screen.getByLabelText('Send'));
    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledWith('t1', { body: 'my payout is late' }));
    await waitFor(() => expect(screen.getByText('my payout is late')).toBeInTheDocument());
  });

  it('escalates to a human and switches the banner', async () => {
    render(<SupportChat />);
    await waitFor(() => expect(screen.getByText('Hi, I am Bolt')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /talk to a human/i }));
    await waitFor(() => expect(escalateSupport).toHaveBeenCalledWith('t1'));
    await waitFor(() => expect(screen.getByText(/connecting you to the book a sloth team/i)).toBeInTheDocument());
    // Once waiting, the "talk to a human" button is gone.
    expect(screen.queryByRole('button', { name: /talk to a human/i })).toBeNull();
  });
});
