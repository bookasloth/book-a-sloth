import { useState, useRef, useEffect } from 'react';
import { askBot, sendBotFeedback } from '../../services/api';

// Bolt 958 — floating support-bot bubble + panel, mounted app-wide (App.jsx).
// Answers are grounded on our docs server-side; this component only renders the
// reply, its cited sources, thumbs, and the human-handoff state on escalation.
// Design tokens only: Plus Jakarta headings (font-heading), Poppins body,
// 4px borders, rounded-xl, brand orange (#FE5100) + ink (#1E1E1E).

const sourceLabel = (s) => {
  const file = (s.source_file || '').replace(/^docs\//, '').replace(/\.md$/, '');
  return s.heading ? `${s.heading} · ${file}` : file;
};

export default function BotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Bolt 958, Book A Sloth's support assistant. Ask me anything about setting up services, bookings, plans, or your profile." },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading, open]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const { data } = await askBot({ question, conversationId });
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((m) => [...m, {
        role: 'assistant',
        content: data.answer,
        cited_sources: data.cited_sources || [],
        escalate: !!data.escalate,
        messageId: data.messageId || null,
        feedback: null,
      }]);
    } catch (_) {
      // Never a dead end — even a network failure ends in a human handoff.
      setMessages((m) => [...m, {
        role: 'assistant',
        content: "Something went wrong reaching support just now. Please email bolt@bookasloth.in and a human will help you out.",
        escalate: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const rate = async (idx, value) => {
    const msg = messages[idx];
    if (!msg?.messageId || msg.feedback) return;
    setMessages((m) => m.map((x, i) => (i === idx ? { ...x, feedback: value } : x)));
    try { await sendBotFeedback({ messageId: msg.messageId, feedback: value }); } catch (_) { /* non-fatal */ }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] font-sans">
      {open && (
        <div
          role="dialog"
          aria-label="Bolt 958 support chat"
          className="mb-3 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border-4 border-[#1E1E1E] bg-white shadow-[6px_6px_0_#1E1E1E]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-4 border-[#1E1E1E] bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-[#1E1E1E] bg-white text-base">🦥</span>
              <div>
                <h3 className="font-heading text-sm font-extrabold leading-tight text-white">Bolt 958</h3>
                <p className="text-[11px] leading-tight text-white/90">Book A Sloth support</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="grid h-7 w-7 place-items-center rounded-lg border-2 border-[#1E1E1E] bg-white text-sm font-bold text-[#1E1E1E] hover:bg-[#FFF8EE]"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FFF8EE] px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    'max-w-[85%] rounded-xl border-2 border-[#1E1E1E] px-3 py-2 text-[13px] leading-snug ' +
                    (m.role === 'user'
                      ? 'bg-primary text-white'
                      : m.escalate
                        ? 'bg-[#FFF3D6] text-[#1E1E1E]'
                        : 'bg-white text-[#1E1E1E]')
                  }
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.role === 'assistant' && m.escalate && (
                    <p className="mt-2 text-[11px] font-semibold text-[#8a6d00]">
                      A human from our team will reach out over WhatsApp or email.
                    </p>
                  )}

                  {m.role === 'assistant' && !m.escalate && m.cited_sources?.length > 0 && (
                    <div className="mt-2 border-t-2 border-dashed border-[#1E1E1E]/30 pt-2">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#1E1E1E]/60">Sources</p>
                      <ul className="flex flex-wrap gap-1">
                        {m.cited_sources.map((s, j) => (
                          <li key={j} className="rounded-md border-2 border-[#1E1E1E] bg-[#FFF8EE] px-1.5 py-0.5 text-[10px] font-medium">
                            {sourceLabel(s)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.role === 'assistant' && m.messageId && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button" aria-label="Helpful" disabled={!!m.feedback}
                        onClick={() => rate(i, 'up')}
                        className={'rounded-md border-2 border-[#1E1E1E] px-1.5 py-0.5 text-xs ' + (m.feedback === 'up' ? 'bg-[#4CAF50] text-white' : 'bg-white hover:bg-[#FFF8EE]')}
                      >👍</button>
                      <button
                        type="button" aria-label="Not helpful" disabled={!!m.feedback}
                        onClick={() => rate(i, 'down')}
                        className={'rounded-md border-2 border-[#1E1E1E] px-1.5 py-0.5 text-xs ' + (m.feedback === 'down' ? 'bg-[#EF4444] text-white' : 'bg-white hover:bg-[#FFF8EE]')}
                      >👎</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl border-2 border-[#1E1E1E] bg-white px-3 py-2 text-[13px] text-[#1E1E1E]/60">Bolt is thinking…</div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="flex items-end gap-2 border-t-4 border-[#1E1E1E] bg-white px-3 py-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question…"
              aria-label="Type your question"
              className="max-h-24 flex-1 resize-none rounded-lg border-2 border-[#1E1E1E] px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-lg border-2 border-[#1E1E1E] bg-primary px-3 py-1.5 text-[13px] font-bold text-white shadow-[2px_2px_0_#1E1E1E] disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open Bolt 958 support chat'}
        className="flex items-center gap-2 rounded-xl border-4 border-[#1E1E1E] bg-primary px-4 py-3 font-heading text-sm font-extrabold text-white shadow-[4px_4px_0_#1E1E1E] transition-transform hover:-translate-y-0.5"
      >
        <span className="text-lg">🦥</span>
        <span>{open ? 'Close' : 'Ask Bolt'}</span>
      </button>
    </div>
  );
}
