import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Headset, ShieldQuestion, Plus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupabase } from '../../services/supabaseClient';
import {
  getSupportThread, getSupportThreads, getSupportMessages, startSupportTopic,
  sendSupportMessage, escalateSupport, rateSupportThread, markSupportRead, getSupportHours,
} from '../../services/api';

const CSAT_EMOJI = { 1: '😠', 2: '😕', 3: '😐', 4: '🙂', 5: '🤩' };
import { cn } from '../dashboard/ui/cn';
import Markdown from '../common/Markdown';

// Tame the article-scale <Markdown> styles down to chat-bubble size: no giant
// headings, tight paragraph/list spacing, no dangling last-child margin.
const CHAT_MD = 'text-[13.5px] leading-relaxed [&>div]:text-[13.5px] [&>div]:text-gray-800 '
  + '[&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4 [&_li]:mb-0.5 '
  + '[&_h1]:text-sm [&_h1]:mt-0 [&_h1]:mb-1 [&_h2]:text-sm [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-[13px] [&_h3]:mt-2 [&_h3]:mb-0.5';

// Three-dot "Bolt is typing" bubble, shown while the async bot reply is in flight.
const TypingBubble = () => (
  <div className="flex max-w-[82%] gap-2" role="status" aria-label="Bolt is typing">
    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-[11px]">🦥</div>
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-violet-50 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400"
          style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </div>
  </div>
);

// One reusable support-chat panel. Host and guest both use it — the server derives
// host vs guest from the auth token, so the client is identical. Live updates arrive
// over the thread's Supabase Realtime broadcast channel; the REST history is the
// source of truth (the broadcast just pushes new rows in).

const BANNER = {
  bot:      { text: 'Bolt is here to help. Ask anything — tap "Talk to a human" if you need a person.', cls: 'border-violet-200 bg-violet-50 text-violet-800' },
  waiting:  { text: 'You’re in the queue — the Book A Sloth team will reply right here.', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  assigned: { text: 'A support agent is with you.', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  resolved: { text: 'This conversation was marked resolved. Send a message to reopen it.', cls: 'border-gray-200 bg-gray-50 text-gray-600' },
};

const fmtTime = (iso) => {
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
};

const Bubble = ({ m }) => {
  if (m.sender === 'system') {
    return <div className="mx-auto rounded-full border border-gray-100 bg-white px-3 py-1 text-center text-[11.5px] text-gray-400">{m.body}</div>;
  }
  const mine = m.sender === 'user';
  const isBot = m.sender === 'bot';
  return (
    <div className={cn('flex max-w-[82%] gap-2', mine && 'flex-row-reverse self-end')}>
      {!mine && (
        <div className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold',
          isBot ? 'bg-violet-100 text-violet-700' : 'bg-primary/15 text-primary')}>
          {isBot ? '🦥' : (m.sender_name?.[0]?.toUpperCase() || 'S')}
        </div>
      )}
      <div className={cn('rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed',
        mine ? 'rounded-tr-sm bg-primary text-white' : isBot ? 'rounded-tl-sm bg-violet-50 text-gray-800' : 'rounded-tl-sm bg-[#f0ede6] text-gray-800')}>
        {!mine && !isBot && m.sender_name && <p className="mb-0.5 text-[11px] font-semibold text-primary">{m.sender_name}</p>}
        {isBot
          ? <div className={CHAT_MD}><Markdown source={m.body} /></div>
          : <p className="whitespace-pre-wrap break-words">{m.body}</p>}
        <p className={cn('mt-1 text-[10px]', mine ? 'text-white/60' : 'text-gray-400')}>{fmtTime(m.created_at)}</p>
      </div>
    </div>
  );
};

export default function SupportChat() {
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hours, setHours] = useState({ open: true, label: '' });
  const [intake, setIntake] = useState(null); // null | { detail, busy } while collecting the problem
  const [threads, setThreads] = useState([]); // topic switcher
  const [showTopics, setShowTopics] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [rated, setRated] = useState(false); // local flag after CSAT submit
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);
  const chanRef = useRef(null);

  // Track whether the user is pinned to the bottom, so incoming messages don't
  // yank them down mid-scroll while they read history.
  const onScroll = () => {
    const el = scrollRef.current;
    if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const append = useCallback((m) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  // Initial load.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getSupportThread();
        if (!active) return;
        setThread(data.thread);
        setMessages(data.messages || []);
        // Loading the thread marks it read server-side — clear the nav badge.
        window.dispatchEvent(new Event('support:unread-changed'));
      } catch {
        toast.error('Couldn’t load your chat');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Whether live support is open now — drives "Talk to a human" vs "Raise a ticket".
  useEffect(() => {
    let active = true;
    getSupportHours().then(({ data }) => { if (active) setHours(data); }).catch(() => {});
    return () => { active = false; };
  }, []);

  // The user's topics, for the switcher. Best-effort — a failure just hides the list.
  const refreshThreads = useCallback(() => {
    getSupportThreads().then(({ data }) => setThreads(data.threads || [])).catch(() => {});
  }, []);
  useEffect(() => { refreshThreads(); }, [refreshThreads]);

  // Switch the panel to another existing topic.
  const switchTo = async (id) => {
    setShowTopics(false);
    if (!id || id === thread?.id || switching) return;
    setSwitching(true);
    try {
      const { data } = await getSupportMessages(id);
      setThread(data.thread);
      setMessages(data.messages || []);
      window.dispatchEvent(new Event('support:unread-changed'));
    } catch { toast.error('Couldn’t open that topic'); }
    finally { setSwitching(false); }
  };

  // Start a fresh topic — a clean panel, old history untouched and still reachable.
  const newTopic = async () => {
    setShowTopics(false);
    if (switching) return;
    setSwitching(true);
    try {
      const { data } = await startSupportTopic();
      setThread(data.thread);
      setMessages(data.messages || []);
      setIntake(null);
      refreshThreads();
    } catch { toast.error('Couldn’t start a new topic'); }
    finally { setSwitching(false); }
  };

  // Realtime: subscribe to this thread's broadcast channel. Anon client is fine —
  // broadcast needs no RLS, and the channel name is the unguessable thread uuid.
  useEffect(() => {
    if (!thread?.id) return undefined;
    let cancelled = false;
    (async () => {
      const sb = await getSupabase();
      if (cancelled) return;
      const chan = sb
        .channel(`support:thread:${thread.id}`)
        .on('broadcast', { event: 'message' }, ({ payload }) => {
          append(payload);
          if (payload.sender !== 'user') {
            markSupportRead(thread.id).catch(() => {});
            window.dispatchEvent(new Event('support:unread-changed'));
          }
        })
        .on('broadcast', { event: 'status' }, ({ payload }) => setThread((t) => ({ ...t, ...payload })))
        .subscribe();
      chanRef.current = chan;
    })();
    return () => {
      cancelled = true;
      if (chanRef.current) getSupabase().then((sb) => sb.removeChannel(chanRef.current)).catch(() => {});
    };
  }, [thread?.id, append]);

  // Auto-scroll to newest only when already at the bottom (or it's the user's own
  // send — see below), never interrupting a scroll-up through history.
  useEffect(() => {
    if (atBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Bot is "typing" while we're in the bot phase and the last message is the
  // user's — i.e. the async Bolt reply is on its way.
  const last = messages[messages.length - 1];
  const botTyping = thread?.status === 'bot' && last?.sender === 'user';
  useEffect(() => {
    if (botTyping && atBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [botTyping]);

  const send = async (e) => {
    e?.preventDefault();
    const body = input.trim();
    if (!body || !thread) return;
    setInput('');
    setSending(true);
    atBottomRef.current = true; // sending your own message always scrolls to it
    try {
      const { data: msg } = await sendSupportMessage(thread.id, { body });
      append(msg);
    } catch {
      toast.error('Message failed to send');
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  // Submit the intake: the user has described the problem in detail — hand off to a
  // human (in hours) or log a ticket (off hours). The detail becomes the thread's
  // summary so the team opens with context.
  const submitIntake = async (e) => {
    e?.preventDefault();
    const detail = (intake?.detail || '').trim();
    if (detail.length < 15 || !thread) return;
    setIntake((s) => ({ ...s, busy: true }));
    atBottomRef.current = true;
    try {
      const { data } = await escalateSupport(thread.id, { summary: detail });
      setThread((t) => ({ ...t, ...data.thread }));
      setIntake(null);
    } catch {
      toast.error('Couldn’t reach the team — try again');
      setIntake((s) => ({ ...s, busy: false }));
    }
  };

  const rate = async (n) => {
    if (!thread) return;
    setRated(true); // optimistic
    try {
      const { data } = await rateSupportThread(thread.id, { rating: n });
      setThread((t) => ({ ...t, ...data.thread }));
    } catch { toast.error('Couldn’t save your rating'); setRated(false); }
  };

  const banner = thread ? BANNER[thread.status] : null;
  const showCsat = thread?.status === 'resolved' && !thread?.rating && !rated;
  const isBotPhase = thread?.status === 'bot';
  // Offer the human option only after Bolt has actually replied — nudges users to
  // try the bot first instead of reflexively asking for a person.
  const botHasReplied = messages.some((m) => m.sender === 'bot');
  const canEscalate = isBotPhase && botHasReplied && !intake;

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-lg">🦥</div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-bold text-gray-900">Book A Sloth support</p>
          <p className="text-[11.5px] text-gray-400">{isBotPhase ? 'Bolt assistant · replies instantly' : 'Our team is on it'}</p>
        </div>

        {/* Topic switcher — only meaningful once there's more than one topic. */}
        {threads.length > 1 && (
          <div className="relative">
            <button type="button" onClick={() => setShowTopics((v) => !v)}
              aria-haspopup="listbox" aria-expanded={showTopics}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-gray-600 hover:bg-gray-50">
              Topics <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showTopics && (
              <div role="listbox" className="absolute right-0 z-10 mt-1 max-h-64 w-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                {threads.map((t) => (
                  <button key={t.id} type="button" role="option" aria-selected={t.id === thread?.id} onClick={() => switchTo(t.id)}
                    className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] hover:bg-gray-50',
                      t.id === thread?.id && 'bg-primary/5')}>
                    <span className="min-w-0 flex-1 truncate text-gray-800">{t.subject || t.reference}</span>
                    {t.user_unread > 0 && <span className="shrink-0 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">{t.user_unread}</span>}
                    <span className="shrink-0 text-[10px] uppercase text-gray-400">{t.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button type="button" onClick={newTopic} disabled={switching} title="Start a new topic"
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-primary hover:bg-primary/5 disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" /> New topic
        </button>
      </div>

      {banner && <div className={cn('mx-3 mt-3 rounded-xl border px-3 py-2 text-[12.5px] font-medium', banner.cls)}>{banner.text}</div>}

      {showCsat && (
        <div className="mx-3 mt-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-center">
          <p className="mb-1 text-[12px] text-gray-500">How did we do?</p>
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => rate(n)} aria-label={`Rate ${n} of 5`}
                className="text-xl transition-transform hover:scale-125">{CSAT_EMOJI[n]}</button>
            ))}
          </div>
        </div>
      )}
      {thread?.status === 'resolved' && (thread?.rating || rated) && (
        <p className="mx-3 mt-2 text-center text-[12px] text-gray-400">Thanks for the feedback 🙏</p>
      )}

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="m-auto flex flex-col items-center gap-2 text-gray-400">
            <ShieldQuestion className="h-6 w-6 animate-pulse" />
            <p className="text-sm">Loading your chat…</p>
          </div>
        ) : (
          <>
            {messages.map((m) => <Bubble key={m.id} m={m} />)}
            {botTyping && <TypingBubble />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Human-handoff nudge — appears only after Bolt has replied. */}
      {canEscalate && (
        <div className="flex items-center justify-center border-t border-gray-100 bg-white px-3 py-2">
          <button type="button" onClick={() => setIntake({ detail: '', busy: false })}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
            <Headset className="h-3.5 w-3.5" /> {hours.open ? 'Talk to a human' : 'Raise a ticket'}
          </button>
        </div>
      )}

      {/* Intake — describe the problem in detail before a human is assigned. */}
      {intake ? (
        <form onSubmit={submitIntake} className="border-t border-gray-100 bg-white px-3 py-3">
          <p className="mb-1.5 text-[12.5px] font-semibold text-gray-800">
            {hours.open ? 'Tell us what you need help with' : 'Leave the team a detailed message'}
          </p>
          <p className="mb-2 text-[11.5px] text-gray-400">
            {hours.open
              ? 'Describe the problem in detail — include booking IDs, dates, or links so we can help fast.'
              : `We're offline right now (${hours.label || 'off-hours'}). Add full detail and we'll reply here when we're back.`}
          </p>
          <textarea
            value={intake.detail}
            onChange={(e) => setIntake((s) => ({ ...s, detail: e.target.value }))}
            rows={3} autoFocus
            placeholder="What's going on? The more detail, the faster we can solve it."
            aria-label="Describe your problem"
            className="w-full resize-none rounded-xl border border-gray-200 bg-[#f7f5ef] px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setIntake(null)} className="text-xs font-medium text-gray-400 hover:text-gray-600">Cancel</button>
            <button type="submit" disabled={intake.busy || intake.detail.trim().length < 15}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-40">
              {intake.busy ? 'Sending…' : hours.open ? 'Connect me to a human' : 'Submit ticket'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message…"
            aria-label="Message"
            className="flex-1 rounded-full border border-gray-200 bg-[#f7f5ef] px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button type="submit" disabled={sending || !input.trim()} aria-label="Send"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40">
            <Send className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </form>
      )}
    </div>
  );
}
