import { useState, useRef, useEffect } from 'react';
import { streamBot, sendBotFeedback } from '../../services/api';
import Markdown from './Markdown';

// Bolt — Book A Sloth's floating support assistant. Mounted app-wide (App.jsx).
// Blended look: reference-widget layout + polish, on Book A Sloth's brand (orange
// #FE5100 + ink #1E1E1E, Plus Jakarta headings / Poppins body, medium borders).
// The answer STREAMS in over SSE and renders through <Markdown>, so the model's
// **bold**/links render as formatting — raw HTML tags are never shown.

const PRIMARY = '#FE5100';
const INK = '#1E1E1E';

// Starter prompts on the welcome screen — one tap sends the question.
const SUGGESTIONS = [
  'How do I book a service?',
  'Payments & refunds',
  'Plans & pricing',
  'Become a host',
  'Reschedule or cancel',
  'Calendar sync',
];

const sourceLabel = (s) => {
  const file = (s.source_file || '').replace(/^docs\/(help\/)?/, '').replace(/\.md$/, '').replace(/-/g, ' ');
  return s.heading ? `${s.heading}` : file;
};

// Apply fn to the last assistant message (the one currently streaming).
const patchLastAssistant = (msgs, fn) => {
  let idx = -1;
  for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === 'assistant') { idx = i; break; }
  if (idx === -1) return msgs;
  return msgs.map((m, i) => (i === idx ? fn(m) : m));
};

function Avatar({ size = 28, ring = false }) {
  return (
    <span
      className="grid place-items-center overflow-hidden rounded-lg bg-white"
      style={{ width: size, height: size, border: ring ? `2px solid ${INK}` : 'none' }}
    >
      <img src="/favicon.svg" alt="" className="h-full w-full object-contain p-0.5" />
    </span>
  );
}

export default function BotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]); // empty → welcome screen
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || streaming) return;
    setInput('');
    setMessages((m) => [
      ...m,
      { role: 'user', content: question },
      { role: 'assistant', content: '', streaming: true, cited_sources: [], escalate: false, messageId: null, feedback: null },
    ]);
    setStreaming(true);
    await streamBot(
      { question, conversationId },
      {
        onDelta: (t) => setMessages((m) => patchLastAssistant(m, (a) => ({ ...a, content: a.content + t }))),
        onDone: (d) => {
          if (d.conversationId) setConversationId(d.conversationId);
          setMessages((m) => patchLastAssistant(m, (a) => ({
            ...a, streaming: false, cited_sources: d.cited_sources || [],
            escalate: !!d.escalate, messageId: d.messageId || null,
          })));
        },
        onError: () => setMessages((m) => patchLastAssistant(m, (a) => ({
          ...a, streaming: false, escalate: true,
          content: a.content || "Something went wrong reaching support just now. Email bolt@bookasloth.in and a human will jump in.",
        }))),
      },
    );
    setStreaming(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const restart = () => { setMessages([]); setConversationId(null); setInput(''); };

  const rate = async (idx, value) => {
    const msg = messages[idx];
    if (!msg?.messageId || msg.feedback) return;
    setMessages((m) => m.map((x, i) => (i === idx ? { ...x, feedback: value } : x)));
    try { await sendBotFeedback({ messageId: msg.messageId, feedback: value }); } catch (_) { /* non-fatal */ }
  };

  const copy = (content) => { try { navigator.clipboard?.writeText(content); } catch (_) { /* ignore */ } };

  return (
    <div className="fixed bottom-5 right-5 z-[60] font-sans">
      {open && (
        <div
          role="dialog"
          aria-label="Bolt support chat"
          className="mb-3 flex h-[34rem] w-[23rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{ border: `2px solid ${INK}` }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 text-white" style={{ background: PRIMARY, borderBottom: `2px solid ${INK}` }}>
            <div className="relative">
              <Avatar size={30} ring />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#22c55e]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-sm font-extrabold leading-tight">Bolt</h3>
              <p className="text-[11px] leading-tight text-white/90">Book A Sloth support · online</p>
            </div>
            <button
              type="button" onClick={restart} aria-label="Restart chat" title="Restart"
              className="grid h-7 w-7 place-items-center rounded-lg text-white/90 hover:bg-white/15"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
            <button
              type="button" onClick={() => setOpen(false)} aria-label="Close support chat" title="Close"
              className="grid h-7 w-7 place-items-center rounded-lg text-white/90 hover:bg-white/15"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Messages / Welcome */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FFF8F4] px-3.5 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-2 text-center">
                <Avatar size={52} ring />
                <h2 className="mt-3 font-heading text-lg font-extrabold" style={{ color: INK }}>Hey, I'm Bolt 👋</h2>
                <p className="mt-1 max-w-[16rem] text-[13px] text-[#1E1E1E]/70">
                  Ask me about bookings, payments, plans, or hosting. If I can't crack it, I'll grab a human.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s} type="button" onClick={() => send(s)}
                      className="rounded-full border-2 border-[#1E1E1E]/12 bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#1E1E1E]/80 transition-colors hover:border-transparent hover:bg-[#FFE4D1] hover:text-[#1E1E1E]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={'max-w-[86%] ' + (m.role === 'user' ? '' : 'w-full')}>
                    <div
                      className={
                        'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ' +
                        (m.role === 'user'
                          ? 'text-white'
                          : 'border-2 border-[#1E1E1E]/10 bg-white text-[#1E1E1E] shadow-sm')
                      }
                      style={m.role === 'user' ? { background: PRIMARY } : undefined}
                    >
                      {m.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : m.content ? (
                        <div className="bolt-md"><Markdown source={m.content} externalLinks="strip" /></div>
                      ) : (
                        <div className="flex gap-1 py-1" aria-label="Bolt is typing">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1E1E1E]/40 [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1E1E1E]/40 [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1E1E1E]/40 [animation-delay:300ms]" />
                        </div>
                      )}

                      {/* Sources */}
                      {m.role === 'assistant' && !m.escalate && !m.streaming && m.cited_sources?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1 border-t border-dashed border-[#1E1E1E]/15 pt-2">
                          {m.cited_sources.map((s, j) => (
                            <span key={j} className="rounded-md bg-[#FFF4EC] px-1.5 py-0.5 text-[10px] font-medium text-[#1E1E1E]/60">
                              {sourceLabel(s)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Honest async handoff card (no fake agent, no fake timer) */}
                    {m.role === 'assistant' && m.escalate && !m.streaming && (
                      <div className="mt-2 flex items-center gap-2.5 rounded-xl border-2 border-[#1E1E1E]/10 bg-white p-3 shadow-sm">
                        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#FFE4D1] text-base">🧑‍💻</span>
                        <div className="text-[12px] leading-snug text-[#1E1E1E]/70">
                          <strong className="text-[#1E1E1E]">Passing this to a human.</strong><br />
                          They'll follow up over WhatsApp or email. You can keep chatting meanwhile.
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {m.role === 'assistant' && !m.streaming && m.content && (
                      <div className="mt-1.5 flex items-center gap-1.5 pl-1">
                        <button type="button" onClick={() => copy(m.content)} aria-label="Copy" title="Copy"
                          className="grid h-6 w-6 place-items-center rounded-md text-[#1E1E1E]/40 hover:bg-[#1E1E1E]/5 hover:text-[#1E1E1E]/70">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        </button>
                        {m.messageId && (
                          <>
                            <button type="button" disabled={!!m.feedback} onClick={() => rate(i, 'up')} aria-label="Helpful" title="Helpful"
                              className={'grid h-6 w-6 place-items-center rounded-md ' + (m.feedback === 'up' ? 'text-[#22c55e]' : 'text-[#1E1E1E]/40 hover:bg-[#1E1E1E]/5 hover:text-[#1E1E1E]/70')}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill={m.feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                            </button>
                            <button type="button" disabled={!!m.feedback} onClick={() => rate(i, 'down')} aria-label="Not helpful" title="Not helpful"
                              className={'grid h-6 w-6 place-items-center rounded-md ' + (m.feedback === 'down' ? 'text-[#ef4444]' : 'text-[#1E1E1E]/40 hover:bg-[#1E1E1E]/5 hover:text-[#1E1E1E]/70')}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill={m.feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <div className="flex items-end gap-2 bg-white px-3 py-2.5" style={{ borderTop: `2px solid ${INK}` }}>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything…"
              aria-label="Type your question"
              className="max-h-24 flex-1 resize-none rounded-xl border-2 border-[#1E1E1E]/12 px-3 py-2 text-[13px] outline-none focus:border-[#FE5100]"
            />
            <button
              type="button" onClick={() => send()} disabled={streaming || !input.trim()} aria-label="Send"
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-[#1E1E1E]/15 disabled:text-[#1E1E1E]/40"
              style={!streaming && input.trim() ? { background: PRIMARY } : undefined}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open Bolt support chat'}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[3px_3px_0_#1E1E1E] transition-transform"
        style={{ background: PRIMARY, border: `2px solid ${INK}` }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <img src="/favicon.svg" alt="" className="h-8 w-8 object-contain" />
        )}
      </button>
    </div>
  );
}
