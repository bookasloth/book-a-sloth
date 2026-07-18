import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BotWidget from '../BotWidget';
import { askBot, sendBotFeedback } from '../../../services/api';

vi.mock('../../../services/api', () => ({
  askBot: vi.fn(),
  sendBotFeedback: vi.fn().mockResolvedValue({ data: { ok: true } }),
}));

const open = () => fireEvent.click(screen.getByRole('button', { name: /open bolt 958/i }));
const ask = (text) => {
  fireEvent.change(screen.getByLabelText(/type your question/i), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
};

beforeEach(() => vi.clearAllMocks());

describe('BotWidget', () => {
  it('renders the launcher button', () => {
    render(<BotWidget />);
    expect(screen.getByRole('button', { name: /open bolt 958/i })).toBeInTheDocument();
  });

  it('sends a question and renders the grounded answer with a citation', async () => {
    askBot.mockResolvedValue({
      data: {
        answer: 'Connect Google Calendar from your dashboard settings.',
        cited_sources: [{ source_file: 'docs/architecture.md', heading: 'Google Calendar Integration' }],
        escalate: false, conversationId: 'c1', messageId: 'm1',
      },
    });
    render(<BotWidget />);
    open();
    ask('How do I connect Google Calendar?');

    expect(await screen.findByText(/connect google calendar from your dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Calendar Integration/)).toBeInTheDocument();
    expect(askBot).toHaveBeenCalledWith({ question: 'How do I connect Google Calendar?', conversationId: null });
  });

  it('records thumbs feedback for an answered message', async () => {
    askBot.mockResolvedValue({ data: { answer: 'Yes.', cited_sources: [], escalate: false, conversationId: 'c1', messageId: 'm1' } });
    render(<BotWidget />);
    open();
    ask('Can I add a service?');
    await screen.findByText('Yes.');
    fireEvent.click(screen.getByRole('button', { name: /^helpful$/i }));
    await waitFor(() => expect(sendBotFeedback).toHaveBeenCalledWith({ messageId: 'm1', feedback: 'up' }));
  });

  it('shows the human-handoff state when the reply escalates', async () => {
    askBot.mockResolvedValue({ data: { answer: 'Connecting you to a human.', cited_sources: [], escalate: true, conversationId: 'c1', messageId: 'm2' } });
    render(<BotWidget />);
    open();
    ask('I need a refund');
    expect(await screen.findByText(/a human from our team will reach out/i)).toBeInTheDocument();
  });
});
