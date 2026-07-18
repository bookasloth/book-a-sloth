import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BotWidget from '../BotWidget';
import { streamBot, sendBotFeedback } from '../../../services/api';

// The widget now streams over SSE via streamBot(payload, { onDelta, onDone }).
vi.mock('../../../services/api', () => ({
  streamBot: vi.fn(),
  sendBotFeedback: vi.fn().mockResolvedValue({ data: { ok: true } }),
}));

// Markdown renders <Link>, so the widget must sit inside a router.
const renderWidget = () => render(<BotWidget />, { wrapper: MemoryRouter });
const open = () => fireEvent.click(screen.getByRole('button', { name: /open bolt support/i }));
const ask = (text) => {
  fireEvent.change(screen.getByLabelText(/type your question/i), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
};

beforeEach(() => vi.clearAllMocks());

describe('BotWidget', () => {
  it('renders the launcher button', () => {
    renderWidget();
    expect(screen.getByRole('button', { name: /open bolt support/i })).toBeInTheDocument();
  });

  it('shows the welcome screen with starter suggestions when opened', () => {
    renderWidget();
    open();
    expect(screen.getByText(/hey, i'm bolt/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /how do i book a service/i })).toBeInTheDocument();
  });

  it('streams a grounded answer and renders its cited source', async () => {
    streamBot.mockImplementation(async (_payload, { onDelta, onDone }) => {
      onDelta('Connect Google Calendar from your dashboard settings.');
      onDone({
        escalate: false,
        cited_sources: [{ source_file: 'docs/help/availability.md', heading: 'Google Calendar' }],
        conversationId: 'c1', messageId: 'm1',
      });
    });
    renderWidget();
    open();
    ask('How do I connect Google Calendar?');

    expect(await screen.findByText(/connect google calendar from your dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('Google Calendar')).toBeInTheDocument(); // the source chip
    expect(streamBot).toHaveBeenCalledWith(
      { question: 'How do I connect Google Calendar?', conversationId: null },
      expect.any(Object),
    );
  });

  it('records thumbs feedback for an answered message', async () => {
    streamBot.mockImplementation(async (_p, { onDelta, onDone }) => {
      onDelta('Yes.');
      onDone({ escalate: false, cited_sources: [], conversationId: 'c1', messageId: 'm1' });
    });
    renderWidget();
    open();
    ask('Can I add a service?');
    await screen.findByText('Yes.');
    fireEvent.click(screen.getByRole('button', { name: /^helpful$/i }));
    await waitFor(() => expect(sendBotFeedback).toHaveBeenCalledWith({ messageId: 'm1', feedback: 'up' }));
  });

  it('shows the honest async handoff card when the reply escalates', async () => {
    streamBot.mockImplementation(async (_p, { onDelta, onDone }) => {
      onDelta("Yeah — I'm pulling in a human from the team.");
      onDone({ escalate: true, cited_sources: [], conversationId: 'c1', messageId: 'm2' });
    });
    renderWidget();
    open();
    ask('I need a refund');
    expect(await screen.findByText(/passing this to a human/i)).toBeInTheDocument();
  });
});
