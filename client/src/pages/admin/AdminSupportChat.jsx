// Support Chat inbox — the human side of the host/guest ↔ Bolt → human handoff.
// List (waiting / mine / all) → transcript detail with a live-updating composer.
// Reuses the same per-thread Supabase Realtime broadcast channel the guest/host
// SupportChat panel publishes to (`support:thread:<id>`); REST history is truth.
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSupabase } from '../../services/supabaseClient';
import {
  adminSupportQueue, adminGetSupportThread, adminReplySupport, adminResolveSupport,
} from '../../services/api';
import { PageHeader, Badge, Skeleton } from '../../components/admin/ui';

const FILTERS = [
  { id: 'waiting', label: 'Waiting' },
  { id: 'mine', label: 'Mine' },
  { id: 'all', label: 'All open' },
];
const STATUS_TONE = { bot: 'neutral', waiting: 'warn', assigned: 'ok', resolved: 'neutral' };
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const fmtTime = (s) => { try { return new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };
const who = (t) => (t.participant_type === 'host' ? 'Host' : t.participant_type === 'guest' ? 'Guest' : t.participant_type || '—');

// One transcript line. Admin replies sit right, everyone else left (bot violet,
// system as a centered pill), matching the guest/host panel's visual language.
function Bubble({ m }) {
  if (m.sender === 'system') {
    return <div className="mx-auto rounded-full border adm-border px-3 py-1 text-center text-[11.5px] adm-t3">{m.body}</div>;
  }
  const mine = m.sender === 'admin';
  const isBot = m.sender === 'bot';
  return (
    <div className={'flex max-w-[82%] flex-col ' + (mine ? 'self-end items-end' : 'items-start')}>
      <div className={'rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed ' + (
        mine ? 'rounded-tr-sm bg-[#FE5100] text-white'
          : isBot ? 'rounded-tl-sm bg-violet-50 text-gray-800'
            : 'rounded-tl-sm bg-[#f0ede6] text-gray-800')}>
        {!mine && (m.sender_name || isBot) && (
          <p className={'mb-0.5 text-[11px] font-semibold ' + (isBot ? 'text-violet-700' : 'text-[#FE5100]')}>
            {isBot ? '🦥 Bolt' : m.sender_name}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
        <p className={'mt-1 text-[10px] ' + (mine ? 'text-white/60' : 'text-gray-400')}>{fmtTime(m.created_at)}</p>
      </div>
    </div>
  );
}

export default function AdminSupportChat() {
  const [filter, setFilter] = useState('waiting');
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);        // { thread, messages }
  const [reply, setReply] = useState({ body: '', busy: false });
  const bottomRef = useRef(null);
  const chanRef = useRef(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try { const { data } = await adminSupportQueue(filter); setThreads(data.threads || []); }
    catch { toast.error('Could not load the queue'); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { loadQueue(); }, [loadQueue]);

  const append = useCallback((m) => {
    setSel((s) => (s && !s.messages.some((x) => x.id === m.id) ? { ...s, messages: [...s.messages, m] } : s));
  }, []);

  const open = async (id) => {
    setReply({ body: '', busy: false });
    try { const { data } = await adminGetSupportThread(id); setSel(data); }
    catch { toast.error('Could not open thread'); }
  };

  // Live updates for the open thread only.
  useEffect(() => {
    const id = sel?.thread?.id;
    if (!id) return undefined;
    let cancelled = false;
    (async () => {
      const sb = await getSupabase();
      if (cancelled) return;
      chanRef.current = sb
        .channel(`support:thread:${id}`)
        .on('broadcast', { event: 'message' }, ({ payload }) => append(payload))
        .on('broadcast', { event: 'status' }, ({ payload }) => setSel((s) => (s ? { ...s, thread: { ...s.thread, ...payload } } : s)))
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (chanRef.current) getSupabase().then((sb) => sb.removeChannel(chanRef.current)).catch(() => {});
    };
  }, [sel?.thread?.id, append]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sel?.messages]);

  const send = async (e) => {
    e?.preventDefault();
    const body = reply.body.trim();
    if (!body || reply.busy || !sel) return;
    setReply({ body: '', busy: true });
    try {
      const { data: msg } = await adminReplySupport(sel.thread.id, { body });
      append(msg);
      // Replying claims the thread server-side (bot/waiting → assigned).
      setSel((s) => (s && s.thread.status !== 'assigned' ? { ...s, thread: { ...s.thread, status: 'assigned' } } : s));
      loadQueue();
    } catch {
      toast.error('Reply failed');
      setReply({ body, busy: false });
      return;
    }
    setReply({ body: '', busy: false });
  };

  const resolve = async () => {
    if (!sel) return;
    try {
      await adminResolveSupport(sel.thread.id);
      toast.success('Marked resolved');
      setSel((s) => (s ? { ...s, thread: { ...s.thread, status: 'resolved' } } : s));
      loadQueue();
    } catch { toast.error('Could not resolve'); }
  };

  // Detail view.
  if (sel) {
    const t = sel.thread;
    return (
      <div>
        <button onClick={() => setSel(null)} className="mb-3 text-sm font-medium text-[#FE5100]">← Back to queue</button>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-sm font-semibold text-[#1E1E1E]">{t.reference}</code>
          <Badge tone={STATUS_TONE[t.status] || 'neutral'}>{t.status}</Badge>
          <span className="text-xs adm-t3">{who(t)}{t.guest_phone ? ` · ${t.guest_phone}` : ''}</span>
          {t.status !== 'resolved' && (
            <button onClick={resolve} className="ml-auto rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">Mark resolved</button>
          )}
        </div>
        {t.subject && <p className="mt-2 text-sm font-semibold adm-t1">{t.subject}</p>}

        <div className="mt-3 flex flex-col gap-2.5 rounded-xl border adm-border p-3" style={{ minHeight: 320 }}>
          {sel.messages.length === 0
            ? <p className="m-auto text-sm adm-t3">No messages yet.</p>
            : sel.messages.map((m) => <Bubble key={m.id} m={m} />)}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="mt-3 flex items-end gap-2">
          <textarea
            value={reply.body} onChange={(ev) => setReply((r) => ({ ...r, body: ev.target.value }))}
            onKeyDown={(ev) => { if (ev.key === 'Enter' && !ev.shiftKey) send(ev); }}
            rows={2} placeholder="Reply to the customer…" aria-label="Reply"
            className="flex-1 rounded-lg border adm-border px-3 py-2 text-sm" />
          <button type="submit" disabled={reply.busy || !reply.body.trim()}
            className="rounded-lg bg-[#FE5100] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40">
            {reply.busy ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    );
  }

  // Queue view.
  return (
    <div>
      <PageHeader title="Support Chat" subtitle="Live conversations Bolt handed to the team — reply, and mark resolved." />
      <div className="mb-3 flex gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={'rounded-lg px-3 py-1.5 text-sm font-medium ' + (filter === f.id ? 'bg-[#FE5100] text-white' : 'border adm-border adm-t2')}>
            {f.label}
          </button>
        ))}
      </div>
      {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        : threads.length === 0 ? <p className="text-sm adm-t3">{filter === 'waiting' ? 'Nothing waiting — Bolt is handling everything.' : 'No open threads here.'}</p>
          : (
            <div className="space-y-2">
              {threads.map((t) => (
                <button key={t.id} onClick={() => open(t.id)} className="block w-full rounded-xl border adm-border p-3 text-left hover:border-[#FE5100]">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-xs font-semibold text-[#1E1E1E]">{t.reference}</code>
                    <Badge tone={STATUS_TONE[t.status] || 'neutral'}>{t.status}</Badge>
                    <span className="text-xs adm-t3">{who(t)}</span>
                    {t.admin_unread > 0 && <Badge tone="warn">{t.admin_unread} new</Badge>}
                    <span className="ml-auto text-xs adm-t3">{fmtDate(t.last_message_at)}</span>
                  </div>
                  <p className="text-sm adm-t1">{t.subject || `${who(t)} conversation`}</p>
                </button>
              ))}
            </div>
          )}
    </div>
  );
}
