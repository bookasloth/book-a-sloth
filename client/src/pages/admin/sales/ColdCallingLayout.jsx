// Cold Calling — shared frame for /admin/sales/cold-calling/*: list picker, lead
// search, CSV upload, today's numbers, and the call queue every page reads
// (via <Outlet context>). Spec: docs/superpowers/specs/2026-10-05-cold-calling-design.md
import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader, StatCard, Btn, Skeleton, Card } from '../../../components/admin/ui';
import { crmListLists, crmColdCallQueue } from '../../../services/api';
import ColdCallUpload from './ColdCallUpload';
import ColdCallSearch from './ColdCallSearch';

const POLL_MS = 60 * 1000;
const LIST_KEY = 'bas.coldCall.listId';

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    o.frequency.value = 880; o.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* audio unavailable */ }
}

export default function ColdCallingLayout() {
  const navigate = useNavigate();
  const [lists, setLists] = useState(null);
  const [listId, setListId] = useState(() => { try { return localStorage.getItem(LIST_KEY) || ''; } catch { return ''; } });
  const [queue, setQueue] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const notified = useRef(new Set());

  const loadLists = useCallback(() => crmListLists().then(({ data }) => {
    const all = Array.isArray(data) ? data : [];
    setLists(all);
    setListId((cur) => (cur && all.some((l) => l.id === cur) ? cur : (all.find((l) => l.source === 'cold_call')?.id || '')));
  }).catch(() => setLists([])), []);
  useEffect(() => { loadLists(); }, [loadLists]);

  // `poll` = the 60s background refresh: skipped while the tab is hidden (a tab left open
  // all day must not burn Render/Supabase egress). First load, post-save and post-import
  // refreshes always run — a tab opened in the background must not sit on a skeleton.
  const loadQueue = useCallback(async ({ poll = false } = {}) => {
    if (poll && document.hidden) return;
    setNow(new Date());
    if (!listId) { setQueue(null); return; }
    try { const { data } = await crmColdCallQueue(listId); setQueue(data); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not load the call queue'); }
  }, [listId]);
  useEffect(() => {
    loadQueue();
    const t = setInterval(() => loadQueue({ poll: true }), POLL_MS);
    const onVisible = () => { if (!document.hidden) loadQueue(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [loadQueue]);
  useEffect(() => { try { if (listId) localStorage.setItem(LIST_KEY, listId); } catch { /* private mode */ } }, [listId]);

  // Callback reminders: ask once, then popup + beep when one becomes due.
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  }, []);
  useEffect(() => {
    for (const c of queue?.callbacksDue || []) {
      if (notified.current.has(c.followUp.id) || new Date(c.dueAt) > new Date()) continue;
      notified.current.add(c.followUp.id);
      beep();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Callback due', { body: c.lead.business_name || c.lead.name || 'Lead' });
      }
    }
  }, [queue]);

  const t = queue?.today;
  const tot = queue?.totals;
  const rate = t?.calls ? Math.round((t.connected / t.calls) * 100) : 0;
  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Cold Calling" subtitle="Open a lead, call, update the details, log the outcome, send the follow-up, move on."
        actions={<div className="flex flex-wrap items-center gap-2">
          <ColdCallSearch onPick={(lead) => navigate(`/admin/sales/cold-calling/lead/${lead.id}`)} />
          <select className="fb-input text-sm !w-auto max-w-[260px]" aria-label="Calling list" value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="">Choose a list…</option>
            {(lists || []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <Btn size="sm" variant="outline" onClick={() => setShowUpload(true)}>Upload CSV</Btn>
        </div>} />

      {t && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          <StatCard compact label="Called today" value={`${t.calls} / ${t.target}`} icon="phone" iconColor="bg-[#FE5100]" />
          <StatCard compact label="Connected" value={`${t.connected}${t.calls ? ` · ${rate}%` : ''}`} icon="users" iconColor="bg-sky-500" />
          <StatCard compact label="Interested" value={t.interested} icon="star" iconColor="bg-emerald-500" />
          <StatCard compact label="Follow-ups sent" value={t.followUpsSent} icon="send" iconColor="bg-violet-500" />
          <StatCard compact label="Left to call" value={(tot?.fresh ?? 0).toLocaleString('en-IN')} icon="layers" iconColor="bg-gray-500" />
          <StatCard compact label="Signed up" value={tot?.signedUp ?? 0} icon="userCheck" iconColor="bg-amber-500" />
        </div>
      )}

      {lists === null || (listId && !queue) ? <Skeleton className="h-64 rounded-2xl" />
        : !listId ? <Card className="p-10 text-center adm-t3">Upload a CSV to start a calling list.</Card>
        : <Outlet context={{ queue, listId, lists, reload: loadQueue, now }} />}

      {showUpload && (
        <ColdCallUpload lists={lists || []} onClose={() => setShowUpload(false)}
          onImported={(id) => { setShowUpload(false); loadLists(); setListId(id); }} />
      )}
    </div>
  );
}
