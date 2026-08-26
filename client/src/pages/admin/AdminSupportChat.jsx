// Support Chat inbox — the human side of the host/guest ↔ Bolt → human handoff.
// List (waiting / mine / all) → transcript detail with a live-updating composer.
// Reuses the same per-thread Supabase Realtime broadcast channel the guest/host
// SupportChat panel publishes to (`support:thread:<id>`); REST history is truth.
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSupabase } from '../../services/supabaseClient';
import {
  adminSupportQueue, adminGetSupportThread, adminReplySupport, adminResolveSupport,
  adminAssignSupport, adminSupportContext, adminListEscalations,
} from '../../services/api';
import { PageHeader, Badge, Skeleton } from '../../components/admin/ui';
import EscalationDetail from './bolt/EscalationDetail';

const FILTERS = [
  { id: 'waiting', label: 'Waiting' },
  { id: 'mine', label: 'Mine' },
  { id: 'all', label: 'All open' },
];
const STATUS_TONE = { bot: 'neutral', waiting: 'warn', assigned: 'ok', resolved: 'neutral' };
const ESC_TONE = { open: 'warn', replied: 'ok', closed: 'neutral' };
// Normalize both stores into one queue row. _kind routes the click + detail view.
const normThread = (t) => ({
  _kind: 'thread', id: t.id, reference: t.reference, status: t.status, tone: STATUS_TONE[t.status] || 'neutral',
  whoLabel: t.participant_type === 'host' ? 'Host' : t.participant_type === 'guest' ? 'Guest' : t.participant_type || '—',
  title: t.subject || `${t.participant_type || 'Support'} conversation`, unread: t.admin_unread || 0,
  agent: t.status === 'assigned' ? t.agent_name : null, at: t.last_message_at || t.created_at,
});
const normEsc = (e) => ({
  _kind: 'esc', id: e.id, reference: e.reference, status: e.status, tone: ESC_TONE[e.status] || 'neutral',
  whoLabel: e.logged_in ? (e.is_host ? 'Host' : 'Guest') : 'Anon',
  title: e.summary || 'Bolt escalation', unread: 0, agent: null, at: e.created_at,
});
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const fmtTime = (s) => { try { return new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };
const who = (t) => (t.participant_type === 'host' ? 'Host' : t.participant_type === 'guest' ? 'Guest' : t.participant_type || '—');

// Small status pill tones for booking/payment/kyc state on the context rail.
const PILL = {
  paid: 'bg-green-50 text-green-700', unpaid: 'bg-amber-50 text-amber-700', refunded: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-50 text-green-700', completed: 'bg-blue-50 text-blue-700', pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-rose-50 text-rose-700', no_show: 'bg-rose-50 text-rose-700',
  approved: 'bg-green-50 text-green-700', rejected: 'bg-rose-50 text-rose-700', none: 'bg-gray-100 text-gray-500',
};
const Pill = ({ v }) => (v ? <span className={'rounded px-1.5 py-0.5 text-[10.5px] font-medium ' + (PILL[v] || 'bg-gray-100 text-gray-600')}>{String(v).replace('_', ' ')}</span> : null);
const fmtDay = (s) => { try { return s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'; } catch { return '—'; } };
const Row = ({ k, children }) => (
  <div className="flex items-center justify-between gap-2 py-1 text-[12px]"><span className="adm-t3">{k}</span><span className="text-right font-medium adm-t1">{children}</span></div>
);

// The context rail — "give support eyes". Customer's live record beside the chat.
function ContextRail({ ctx, thread }) {
  if (!ctx) return <div className="rounded-xl border adm-border p-3 text-[12px] adm-t3">Loading customer context…</div>;
  const p = ctx.profile || {};
  const isHost = ctx.kind === 'host';
  return (
    <aside className="flex flex-col gap-3">
      <div className="rounded-xl border adm-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide adm-t3">{isHost ? 'Host' : 'Guest'}</p>
          {isHost && thread.user_id && (
            <a href={`/admin/host360/${thread.user_id}`} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-[#FE5100] hover:underline">Open Host360 ↗</a>
          )}
        </div>
        <p className="text-sm font-semibold adm-t1">{p.name || '—'}</p>
        {p.phone && <p className="text-[12px] adm-t3">{p.phone}</p>}
        {isHost && (
          <div className="mt-2 border-t adm-border pt-2">
            <Row k="Plan">{p.plan || '—'}{p.planExpiresAt ? ` · exp ${fmtDay(p.planExpiresAt)}` : ''}</Row>
            <Row k="Onboarding">{p.onboardingCompleted ? '✓ done' : '⚠ incomplete'}</Row>
            {ctx.host && (
              <>
                <Row k="Listing live"><Pill v={ctx.host.listingActive ? 'confirmed' : 'cancelled'} /></Row>
                <Row k="KYC"><Pill v={ctx.host.kyc?.status || 'none'} /></Row>
                <Row k="Payout">{ctx.host.payoutLinked ? '✓ linked' : '⚠ not linked'}</Row>
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border adm-border p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide adm-t3">Recent bookings</p>
        {(!ctx.bookings || ctx.bookings.length === 0)
          ? <p className="text-[12px] adm-t3">None found.</p>
          : (
            <div className="flex flex-col gap-2">
              {ctx.bookings.map((b, i) => (
                <div key={i} className="rounded-lg bg-[#faf9f7] p-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <code className="text-[11px] font-semibold adm-t2">{b.ref}</code>
                    <span className="adm-t3">{fmtDay(b.when)}</span>
                  </div>
                  <p className="truncate adm-t1">{b.service || (isHost ? (b.guest || 'Booking') : 'Booking')}</p>
                  <div className="mt-1 flex gap-1"><Pill v={b.status} /><Pill v={b.payment_status} /></div>
                </div>
              ))}
            </div>
          )}
      </div>
    </aside>
  );
}

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
  const [items, setItems] = useState([]);      // merged threads + Bolt escalations
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);        // { thread, messages }
  const [selEsc, setSelEsc] = useState(null);  // escalation id when a Bolt row is open
  const [reply, setReply] = useState({ body: '', busy: false });
  const [context, setContext] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const bottomRef = useRef(null);
  const chanRef = useRef(null);

  // Unified queue: dashboard threads + Bolt escalations in one list. Escalations
  // have no assignee, so the "Mine" filter shows threads only.
  const loadQueue = useCallback(async () => {
    setLoading(true);
    const wantEsc = filter !== 'mine';
    const [tq, eq] = await Promise.allSettled([
      adminSupportQueue(filter),
      wantEsc ? adminListEscalations({ status: filter === 'waiting' ? 'open' : 'all' }) : Promise.resolve({ data: { escalations: [] } }),
    ]);
    if (tq.status === 'rejected' && eq.status === 'rejected') toast.error('Could not load the inbox');
    const threads = (tq.value?.data?.threads || []).map(normThread);
    let escs = (eq.value?.data?.escalations || []);
    if (filter === 'all') escs = escs.filter((e) => e.status !== 'closed'); // "All" = open work only
    const merged = [...threads, ...escs.map(normEsc)].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    setItems(merged);
    setLoading(false);
  }, [filter]);
  useEffect(() => { loadQueue(); }, [loadQueue]);

  const append = useCallback((m) => {
    setSel((s) => (s && !s.messages.some((x) => x.id === m.id) ? { ...s, messages: [...s.messages, m] } : s));
  }, []);

  const open = async (id) => {
    setReply({ body: '', busy: false });
    setContext(null);
    try { const { data } = await adminGetSupportThread(id); setSel(data); }
    catch { toast.error('Could not open thread'); return; }
    // Context rail loads independently — the transcript never waits on it.
    adminSupportContext(id).then(({ data }) => setContext(data.context)).catch(() => {});
  };

  // "Assign to me": claim the thread; the server posts the one-time warm intro.
  const assignToMe = async () => {
    if (!sel || assigning) return;
    setAssigning(true);
    try {
      await adminAssignSupport(sel.thread.id);
      const { data } = await adminGetSupportThread(sel.thread.id); // pick up intro + status
      setSel(data);
      loadQueue();
    } catch { toast.error('Could not assign'); }
    finally { setAssigning(false); }
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

  // Bolt-escalation detail — shared component, opened from a 🦥 row in the queue.
  if (selEsc) {
    return <EscalationDetail id={selEsc} onBack={() => { setSelEsc(null); loadQueue(); }} onChanged={loadQueue} />;
  }

  // Thread detail view.
  if (sel) {
    const t = sel.thread;
    const unclaimed = t.status === 'bot' || t.status === 'waiting';
    return (
      <div>
        <button onClick={() => setSel(null)} className="mb-3 text-sm font-medium text-[#FE5100]">← Back to queue</button>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-sm font-semibold text-[#1E1E1E]">{t.reference}</code>
          <Badge tone={STATUS_TONE[t.status] || 'neutral'}>{t.status}</Badge>
          <span className="text-xs adm-t3">{who(t)}{t.guest_phone ? ` · ${t.guest_phone}` : ''}</span>
          {t.agent_name && !unclaimed && <span className="text-xs adm-t3">· {t.agent_name} on it</span>}
          <div className="ml-auto flex gap-2">
            {unclaimed && (
              <button onClick={assignToMe} disabled={assigning}
                className="rounded-lg bg-[#FE5100] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40">
                {assigning ? 'Assigning…' : 'Assign to me'}
              </button>
            )}
            {t.status !== 'resolved' && (
              <button onClick={resolve} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">Mark resolved</button>
            )}
          </div>
        </div>
        {t.subject && <p className="mt-2 text-sm font-semibold adm-t1">{t.subject}</p>}
        {t.ai_summary && (
          <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-[12.5px] text-violet-900">
            <span className="font-semibold">🦥 Bolt summary:</span> {t.ai_summary}
          </p>
        )}

        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-2.5 rounded-xl border adm-border p-3" style={{ minHeight: 320 }}>
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

          <ContextRail ctx={context} thread={t} />
        </div>
      </div>
    );
  }

  // Queue view.
  return (
    <div>
      <PageHeader title="Support Inbox" subtitle="Every conversation in one place — dashboard chats and Bolt widget escalations." />
      <div className="mb-3 flex gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={'rounded-lg px-3 py-1.5 text-sm font-medium ' + (filter === f.id ? 'bg-[#FE5100] text-white' : 'border adm-border adm-t2')}>
            {f.label}
          </button>
        ))}
      </div>
      {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        : items.length === 0 ? <p className="text-sm adm-t3">{filter === 'waiting' ? 'Nothing waiting — Bolt is handling everything.' : 'Nothing open here.'}</p>
          : (
            <div className="space-y-2">
              {items.map((it) => (
                <button key={`${it._kind}:${it.id}`}
                  onClick={() => (it._kind === 'thread' ? open(it.id) : setSelEsc(it.id))}
                  className="block w-full rounded-xl border adm-border p-3 text-left hover:border-[#FE5100]">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs" title={it._kind === 'thread' ? 'Dashboard chat' : 'Bolt widget escalation'}>{it._kind === 'thread' ? '💬' : '🦥'}</span>
                    <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-xs font-semibold text-[#1E1E1E]">{it.reference}</code>
                    <Badge tone={it.tone}>{it.status}</Badge>
                    <span className="text-xs adm-t3">{it.whoLabel}</span>
                    {it.agent && <span className="text-xs adm-t3">· {it.agent}</span>}
                    {it.unread > 0 && <Badge tone="warn">{it.unread} new</Badge>}
                    <span className="ml-auto text-xs adm-t3">{fmtDate(it.at)}</span>
                  </div>
                  <p className="text-sm adm-t1">{it.title}</p>
                </button>
              ))}
            </div>
          )}
    </div>
  );
}
