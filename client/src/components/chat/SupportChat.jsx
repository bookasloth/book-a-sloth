import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Headset, ShieldQuestion } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupabase } from '../../services/supabaseClient';
import { getSupportThread, sendSupportMessage, escalateSupport, markSupportRead } from '../../services/api';
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
  waiting:  { text: 'Connecting you to the Book A Sloth team…', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
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

  const escalate = async () => {
    if (!thread) return;
    try {
      const { data } = await escalateSupport(thread.id);
      setThread((t) => ({ ...t, ...data.thread }));
    } catch {
      toast.error('Couldn’t reach the team — try again');
    }
  };

  const banner = thread ? BANNER[thread.status] : null;
  const isBotPhase = thread?.status === 'bot';

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-lg">🦥</div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-bold text-gray-900">Book A Sloth support</p>
          <p className="text-[11.5px] text-gray-400">{isBotPhase ? 'Bolt assistant · replies instantly' : 'Our team is on it'}</p>
        </div>
        {isBotPhase && (
          <button type="button" onClick={escalate}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
            <Headset className="h-3.5 w-3.5" /> Talk to a human
          </button>
        )}
      </div>

      {banner && <div className={cn('mx-3 mt-3 rounded-xl border px-3 py-2 text-[12.5px] font-medium', banner.cls)}>{banner.text}</div>}

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

      {/* Composer */}
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
    </div>
  );
}
