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
import { priorityOf, waitMinutes, slaLevel, fmtWait, inboxSort, SLA_BREACH_MIN } from '../../utils/supportSla';
import { teamForText, TEAM_LABEL, TEAM_FILTERS } from '../../utils/supportTeams';
import { REASON_GROUPS } from '../../utils/supportReasons';

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
  // Waiting on us: escalated & unclaimed, or a customer replied on a claimed thread.
  waitingOnUs: t.status === 'waiting' || (t.status === 'assigned' && (t.admin_unread || 0) > 0),
  waitingSince: t.last_message_at, priority: priorityOf(t.subject), team: teamForText(t.subject),
});
const normEsc = (e) => ({
  _kind: 'esc', id: e.id, reference: e.reference, status: e.status, tone: ESC_TONE[e.status] || 'neutral',
  whoLabel: e.logged_in ? (e.is_host ? 'Host' : 'Guest') : 'Anon',
  title: e.summary || 'Bolt escalation', unread: 0, agent: null, at: e.created_at,
  waitingOnUs: e.status === 'open', waitingSince: e.created_at,
  priority: priorityOf(`${e.summary || ''} ${e.reason || ''}`), team: teamForText(`${e.summary || ''} ${e.reason || ''}`),
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
          <p className="text-[11px] font-semibold uppercase tracking-wide adm-t3">Customer</p>
          {isHost && thread.user_id && (
            <a href={`/admin/host360/${thread.user_id}`} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-[#FE5100] hover:underline">Open Host360 ↗</a>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF4EC] text-[13px] font-bold text-[#FE5100]">
            {(p.name || '?').trim().slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold adm-t1">{p.name || '—'}</p>
            {p.phone && <p className="text-[12px] adm-t3">{p.phone}</p>}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border adm-border px-2 py-0.5 text-[11px] font-medium adm-t2">{isHost ? 'Host' : 'Guest'}</span>
          {p.joinedAt && <span className="text-[11px] adm-t3">Joined {fmtDay(p.joinedAt)}</span>}
        </div>
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
        {m.attachment_url && (
          <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
            <img src={m.attachment_url} alt="attachment"
              className={'max-h-56 max-w-full rounded-lg object-contain ' + (m.body ? 'mb-1.5' : '')} />
          </a>
        )}
        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
        <p className={'mt-1 text-[10px] ' + (mine ? 'text-white/60' : 'text-gray-400')}>{fmtTime(m.created_at)}</p>
      </div>
    </div>
  );
}

export default function AdminSupportChat() {
  const [filter, setFilter] = useState('waiting');
  const [teamFilter, setTeamFilter] = useState('all');
  const [items, setItems] = useState([]);      // merged threads + Bolt escalations
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);        // { thread, messages }
  const [selEsc, setSelEsc] = useState(null);  // escalation id when a Bolt row is open
  const [reply, setReply] = useState({ body: '', busy: false });
  const [context, setContext] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [now, setNow] = useState(() => Date.now()); // ticks the SLA clock
  const [resolveOpen, setResolveOpen] = useState(false); // reason picker before resolve
  const [reasonCode, setReasonCode] = useState('');
  const bottomRef = useRef(null);
  const chanRef = useRef(null);

  // Re-render each minute so waiting timers + breach badges stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

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
    setItems([...threads, ...escs.map(normEsc)]); // sorted at render with the live clock
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

  const doResolve = async () => {
    if (!sel) return;
    try {
      await adminResolveSupport(sel.thread.id, reasonCode ? { reason_code: reasonCode } : {});
      toast.success('Marked resolved');
      setSel((s) => (s ? { ...s, thread: { ...s.thread, status: 'resolved' } } : s));
      setResolveOpen(false); setReasonCode('');
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
    const assignedLabel = t.status === 'assigned' ? (t.agent_name || 'Support Team') : null;
    const pri = priorityOf(t.subject);
    const waitRow = { waitingOnUs: t.status === 'waiting' || (t.status === 'assigned' && (t.admin_unread || 0) > 0), waitingSince: t.last_message_at };
    const wmin = waitMinutes(waitRow, now);
    const wlvl = slaLevel(wmin);
    return (
      <div>
        <button onClick={() => setSel(null)} className="mb-3 text-sm font-medium text-[#FE5100]">← Back to queue</button>

        {/* Cockpit header */}
        <div className="rounded-xl border adm-border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <code className="text-lg font-bold tracking-tight text-[#1E1E1E]">{t.reference}</code>
            <Badge tone={STATUS_TONE[t.status] || 'neutral'}><span className="capitalize">{t.status}</span></Badge>
            <span className="rounded-full border adm-border px-2 py-0.5 text-[11px] font-medium adm-t2">{who(t)}</span>
            {assignedLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#faf9f7] px-2 py-0.5 text-[11px] font-medium adm-t2">
                <span className="adm-t3">Assigned to</span> {assignedLabel}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {pri !== 'high' ? null : (
                <span className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">Priority · High</span>
              )}
              {unclaimed && (
                <button onClick={assignToMe} disabled={assigning}
                  className="rounded-lg border adm-border px-3 py-1.5 text-xs font-medium adm-t2 hover:border-[#FE5100] disabled:opacity-40">
                  {assigning ? 'Assigning…' : 'Assign to me'}
                </button>
              )}
              {t.status !== 'resolved' && (
                <button onClick={() => setResolveOpen((v) => !v)}
                  className="rounded-lg bg-[#FE5100] px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-95">✓ Resolve ticket</button>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] adm-t3">
            {t.created_at && <span>🕐 Created {fmtTime(t.created_at)}</span>}
            {wmin != null && (
              <span className={'font-medium ' + (wlvl === 'breach' ? 'text-rose-600' : wlvl === 'warn' ? 'text-amber-600' : 'adm-t3')}>
                ⏱ Waiting {fmtWait(wmin)}
              </span>
            )}
          </div>
        </div>
        {resolveOpen && t.status !== 'resolved' && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border adm-border bg-[#faf9f7] px-3 py-2">
            <span className="text-xs font-medium adm-t2">Why did they need us?</span>
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}
              className="rounded-lg border adm-border px-2 py-1 text-xs">
              <option value="">Reason (optional)…</option>
              {REASON_GROUPS.map((g) => (
                <optgroup key={g.category} label={g.category}>
                  {g.items.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                </optgroup>
              ))}
            </select>
            <button onClick={doResolve} className="rounded-lg bg-[#FE5100] px-2.5 py-1 text-xs font-medium text-white">Resolve</button>
            <button onClick={() => { setResolveOpen(false); setReasonCode(''); }} className="text-xs adm-t3">Cancel</button>
          </div>
        )}
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

            <form onSubmit={send} className="mt-3 rounded-xl border adm-border bg-white p-2.5">
              <div className="mb-1.5 flex items-center gap-3 border-b adm-border px-1 pb-1.5">
                <span className="border-b-2 border-[#FE5100] pb-1 text-[13px] font-semibold text-[#FE5100]">Reply</span>
              </div>
              <textarea
                value={reply.body} onChange={(ev) => setReply((r) => ({ ...r, body: ev.target.value }))}
                onKeyDown={(ev) => { if (ev.key === 'Enter' && !ev.shiftKey) send(ev); }}
                rows={3} placeholder={`Reply to ${(context?.profile?.name || 'the customer').split(' ')[0]}…`} aria-label="Reply"
                className="w-full resize-none border-0 px-1 py-1 text-sm outline-none focus:ring-0" />
              <div className="mt-1 flex items-center justify-end">
                <button type="submit" disabled={reply.busy || !reply.body.trim()}
                  className="rounded-lg bg-[#FE5100] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
                  {reply.busy ? 'Sending…' : '➤ Send'}
                </button>
              </div>
            </form>
          </div>

          <ContextRail ctx={context} thread={t} />
        </div>
      </div>
    );
  }

  // Queue view — sorted live (waiting-on-us longest-first), SLA + priority surfaced.
  const sorted = [...items]
    .filter((it) => teamFilter === 'all' || it.team === teamFilter)
    .sort((a, b) => inboxSort(a, b, now));
  const breaches = sorted.reduce((n, it) => n + (slaLevel(waitMinutes(it, now)) === 'breach' ? 1 : 0), 0);
  return (
    <div>
      <PageHeader title="Support Inbox" subtitle="Every conversation in one place — dashboard chats and Bolt widget escalations." />
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={'rounded-lg px-3 py-1.5 text-sm font-medium ' + (filter === f.id ? 'bg-[#FE5100] text-white' : 'border adm-border adm-t2')}>
            {f.label}
          </button>
        ))}
        <span className="mx-1 self-center text-adm-t3">·</span>
        {TEAM_FILTERS.map((f) => (
          <button key={f.id} onClick={() => setTeamFilter(f.id)} title="Route: CXO handles money & bugs, Support the rest"
            className={'rounded-lg px-3 py-1.5 text-sm font-medium ' + (teamFilter === f.id ? 'bg-[#1E1E1E] text-white' : 'border adm-border adm-t2')}>
            {f.label}
          </button>
        ))}
      </div>
      {breaches > 0 && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          ⏱ {breaches} conversation{breaches > 1 ? 's' : ''} breaching SLA — waiting {Math.floor(SLA_BREACH_MIN / 60)}h+ for a reply.
        </div>
      )}
      {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        : sorted.length === 0 ? <p className="text-sm adm-t3">{filter === 'waiting' ? 'Nothing waiting — Bolt is handling everything.' : 'Nothing open here.'}</p>
          : (
            <div className="space-y-2">
              {sorted.map((it) => {
                const mins = waitMinutes(it, now);
                const lvl = slaLevel(mins);
                return (
                  <button key={`${it._kind}:${it.id}`}
                    onClick={() => (it._kind === 'thread' ? open(it.id) : setSelEsc(it.id))}
                    className="block w-full rounded-xl border adm-border p-3 text-left hover:border-[#FE5100]">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs" title={it._kind === 'thread' ? 'Dashboard chat' : 'Bolt widget escalation'}>{it._kind === 'thread' ? '💬' : '🦥'}</span>
                      <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-xs font-semibold text-[#1E1E1E]">{it.reference}</code>
                      <Badge tone={it.tone}>{it.status}</Badge>
                      {it.priority === 'high' && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">High</span>}
                      <span className={'rounded px-1.5 py-0.5 text-[10px] font-semibold ' + (it.team === 'cxo' ? 'bg-violet-100 text-violet-700' : 'bg-sky-50 text-sky-700')}>{TEAM_LABEL[it.team]}</span>
                      {mins != null && (
                        <span className={'rounded px-1.5 py-0.5 text-[10px] font-medium ' + (lvl === 'breach' ? 'bg-rose-100 text-rose-700' : lvl === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500')}>
                          ⏱ {fmtWait(mins)}
                        </span>
                      )}
                      <span className="text-xs adm-t3">{it.whoLabel}</span>
                      {it.agent && <span className="text-xs adm-t3">· {it.agent}</span>}
                      {it.unread > 0 && <Badge tone="warn">{it.unread} new</Badge>}
                      <span className="ml-auto text-xs adm-t3">{fmtDate(it.at)}</span>
                    </div>
                    <p className="text-sm adm-t1">{it.title}</p>
                  </button>
                );
              })}
            </div>
          )}
    </div>
  );
}
