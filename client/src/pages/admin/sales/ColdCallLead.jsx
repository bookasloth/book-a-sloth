// Lead page — one lead at a time: call, update the details, log the outcome,
// send the follow-up, move to the next lead. Left: today's queue. Centre: the
// lead. Right: outcome, next call, notes, save.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Btn, Badge, Skeleton } from '../../../components/admin/ui';
import { crmGetLead, crmLeadTimeline, crmColdCallOutcome, crmColdCallRemind, crmColdCallDetails } from '../../../services/api';
import { Chips, TabBar, SectionTitle } from './ccUi';
import ColdCallCommunicate from './ColdCallCommunicate';
import {
  OUTCOMES, OBJECTIONS, callbackPresets, formatPhone, fmtTimer, isTypingTarget, pendingPlan, nextLeadId,
  messageFor, fitReasons, safeUrl, outcomeLabel, fmtTime, countdown,
} from './coldCallUtils';

const BASE = '/admin/sales/cold-calling';
const NO_FOLLOW_UP = new Set(['not_interested', 'wrong_number']);
const toLocalInput = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

const SCRIPT = [
  ['Open', '"Namaste, main Shubham, Book A Sloth se." Ask for the owner or doctor.'],
  ['Hook', '"Abhi appointments kaise lete hain?" Then listen.'],
  ['Problem', 'Missed calls while working, no-shows, chasing advance payments.'],
  ['Offer', 'Their own booking page: online booking + payment + automatic reminders. Free to start, live in 3 minutes.'],
  ['Ask', '"WhatsApp pe link bhej doon?" Confirm the number and ask for an email.'],
];

const DETAIL_FIELDS = [
  ['business_name', 'Business name'], ['name', 'Contact person'], ['role', 'Role', 'Owner / Manager / Reception'],
  ['email', 'Email', 'Ask on the call'], ['alt_phone', 'Alternate number', 'If they give one'],
  ['website', 'Website'], ['instagram', 'Instagram'], ['address', 'Address'],
  ['hours', 'Business hours', 'e.g. 10 am – 8 pm'], ['profession', 'Category'],
];
const EXTRAS = new Set(['role', 'alt_phone', 'hours', 'address']);
const detailsOf = (lead) => {
  const cc = lead.attributes?.cold_call || {};
  return Object.fromEntries(DETAIL_FIELDS.map(([k]) => [k, (EXTRAS.has(k) ? cc[k] : lead[k]) || '']));
};

function QueueRail({ plan, currentId, now }) {
  const [f, setF] = useState('all');
  const items = plan.filter((p) => (f === 'p1' ? /^p?1$/i.test(String(p.lead.attributes?.cold_call?.priority || ''))
    : f === 'due' ? p.kind !== 'new' : true));
  return (
    <Card className="p-3 xl:sticky xl:top-20">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[14px] font-bold adm-t1">Today's queue <span className="adm-t3 font-medium">({plan.length} left)</span></span>
        <Link to={`${BASE}/today`} className="text-[12px] font-semibold text-[#FE5100]">All →</Link>
      </div>
      <Chips label="Queue filter" value={f} onChange={setF} options={[
        { value: 'all', label: 'All' }, { value: 'p1', label: 'P1' }, { value: 'due', label: 'Due', count: plan.filter((p) => p.kind !== 'new').length },
      ]} />
      <div className="mt-2 max-h-[calc(100vh-260px)] overflow-y-auto space-y-1">
        {items.map((p) => {
          const cc = p.lead.attributes?.cold_call || {};
          const on = p.lead.id === currentId;
          return (
            <Link key={p.lead.id} to={`${BASE}/lead/${p.lead.id}`}
              className={`block rounded-xl px-3 py-2.5 border ${on ? 'border-[#FE5100]/40 bg-[#FE5100]/[0.07]' : 'border-transparent adm-hoverable'}`}>
              <div className="flex justify-between gap-2">
                <span className="text-[13px] font-semibold adm-t1 truncate">{p.lead.business_name || p.lead.name || 'Lead'}</span>
                {p.dueAt && <span className="text-[11px] adm-t3 whitespace-nowrap">{fmtTime(p.dueAt)}</span>}
              </div>
              <div className="text-[11.5px] adm-t3 truncate">{[p.lead.profession, cc.locality].filter(Boolean).join(' · ')}</div>
              <div className="flex gap-1 mt-1">
                {p.kind === 'callback' || p.kind === 'later' ? <Badge tone={p.overdue ? 'danger' : 'warn'}>{p.overdue ? countdown(p.dueAt, now) : 'Callback'}</Badge>
                  : p.kind === 'retry' ? <Badge tone="info">Retry {(cc.attempts || 0) + 1}</Badge> : <Badge tone="neutral">New</Badge>}
                {cc.fit && <Badge tone="ok">fit {cc.fit}</Badge>}
              </div>
            </Link>
          );
        })}
        {!items.length && <div className="text-[12.5px] adm-t3 px-2 py-4">Nothing here.</div>}
      </div>
    </Card>
  );
}

function LeadCall({ initial, plan, queue, reload, now }) {
  const navigate = useNavigate();
  const [lead, setLead] = useState(initial);
  const cc = lead.attributes?.cold_call || {};
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState(() => detailsOf(initial));
  const [outcome, setOutcome] = useState(null);
  const [objection, setObjection] = useState('');
  const [note, setNote] = useState('');
  const [nextAt, setNextAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(null);
  const [comm, setComm] = useState(null);   // { category, callbackAt, savedOutcome, afterSave }
  const saveRef = useRef(null);

  const dirty = useMemo(() => {
    const base = detailsOf(lead);
    return Object.keys(form).some((k) => (form[k] || '') !== (base[k] || ''));
  }, [form, lead]);

  const loadHistory = () => crmLeadTimeline(lead.id).then(({ data }) => setHistory(Array.isArray(data) ? data : [])).catch(() => setHistory([]));
  useEffect(() => { loadHistory(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const idx = plan.findIndex((p) => p.lead.id === lead.id);
  const goTo = (id) => navigate(id ? `${BASE}/lead/${id}` : `${BASE}/today`);
  const goNext = () => goTo(nextLeadId(plan, lead.id));

  const saveDetails = async () => {
    const base = detailsOf(lead);
    const changed = Object.fromEntries(Object.entries(form).filter(([k, v]) => (v || '') !== (base[k] || '')));
    if (!Object.keys(changed).length) return true;
    try {
      const { data } = await crmColdCallDetails(lead.id, changed);
      setLead((l) => ({ ...l, ...data }));
      toast.success('Details saved');
      return true;
    } catch (e) { toast.error(e.response?.data?.message || 'Could not save details'); return false; }
  };

  const save = async (thenNext = true) => {
    if (!outcome || busy) return;
    if (outcome === 'callback' && !nextAt) { toast.error('Pick when to call back'); return; }
    setBusy(true);
    try {
      if (dirty && !(await saveDetails())) return;
      const { data } = await crmColdCallOutcome(lead.id, {
        outcome, note, objection: objection || undefined, durationSec: elapsed || null,
        callbackAt: outcome === 'callback' ? nextAt : null,
      });
      if (nextAt && outcome !== 'callback' && !NO_FOLLOW_UP.has(outcome)) {
        await crmColdCallRemind(lead.id, { at: nextAt, note }).catch(() => toast.error('Call saved, but the follow-up could not be scheduled'));
      }
      for (const w of data?.warnings || []) toast(w);
      setRunning(false);
      reload();
      const category = messageFor(outcome, data?.coldCall || {});
      if (category) {
        setComm({ category, callbackAt: outcome === 'callback' ? nextAt : null, savedOutcome: outcome, afterSave: thenNext });
      } else {
        toast.success('Call saved');
        if (thenNext) goNext(); else { setOutcome(null); setNote(''); setObjection(''); setNextAt(null); loadHistory(); }
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save the call');
    } finally { setBusy(false); }
  };
  saveRef.current = save;

  const pick = (key) => setOutcome(key);
  useEffect(() => {
    const onKey = (e) => {
      if (comm || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const o = OUTCOMES.find((x) => x.hotkey === e.key);
      if (o) { e.preventDefault(); pick(o.key); return; }
      if (e.key === 'Enter') { e.preventDefault(); saveRef.current?.(true); return; }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); setRunning((r) => !r); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const closeComm = (thenNext) => {
    setComm(null);
    if (thenNext) { goNext(); return; }
    setOutcome(null); setNote(''); setObjection(''); setNextAt(null); loadHistory();
  };

  const digits = String(lead.phone || '').replace(/\D/g, '');
  const waDigits = String(lead.whatsapp_phone || lead.phone || '').replace(/\D/g, '');
  const maps = safeUrl(cc.maps_url);
  const site = safeUrl(lead.website);
  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success('Copied')).catch(() => {});
  const planItem = plan[idx];
  const status = cc.attempts > 0 ? `${outcomeLabel(cc.last_outcome)} · call ${cc.attempts + 1}` : 'Not called yet';
  const isCallback = outcome === 'callback';

  return (
    <div className="flex flex-wrap xl:flex-nowrap gap-4 items-start">
      <div className="w-full xl:w-[290px] xl:shrink-0 order-3 xl:order-1"><QueueRail plan={plan} currentId={lead.id} now={now} /></div>

      {/* Centre — the lead */}
      <div className="flex-1 min-w-0 space-y-4 order-1 xl:order-2">
        <Card className="p-5">
          <div className="flex flex-wrap gap-5 justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="warn">{idx >= 0 ? `Lead ${idx + 1} of ${plan.length}${planItem ? ` · ${planItem.kind === 'new' ? 'New' : planItem.kind === 'retry' ? 'Retry' : 'Callback'}` : ''}` : 'Opened from search'}</Badge>
                <span className="flex gap-1">
                  <Btn size="sm" variant="outline" aria-label="Previous lead" disabled={idx <= 0} onClick={() => goTo(plan[idx - 1]?.lead.id)}>‹</Btn>
                  <Btn size="sm" variant="outline" aria-label="Next lead" onClick={goNext}>›</Btn>
                </span>
              </div>
              <h2 className="text-[24px] font-extrabold adm-t1 mt-2 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans',Poppins,sans-serif" }}>{lead.business_name || lead.name || 'Unnamed lead'}</h2>
              <div className="text-[13.5px] adm-t2">{[lead.profession, cc.locality, lead.city].filter(Boolean).join(' · ')}</div>
              <div className="flex flex-wrap gap-1.5 my-3">
                {cc.fit && <Badge tone="ok">Fit {cc.fit}</Badge>}
                {cc.priority && <Badge tone="warn">{/^p/i.test(cc.priority) ? cc.priority : `#${cc.priority}`}</Badge>}
                <Badge tone={cc.attempts > 0 ? 'info' : 'neutral'}>{status}</Badge>
                {lead.do_not_contact && <Badge tone="danger">Do not contact</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`tel:+${digits}`} className="text-[28px] font-extrabold adm-t1 tracking-wide">{formatPhone(lead.phone)}</a>
                <Btn size="sm" variant="outline" onClick={() => copy(formatPhone(lead.phone).replace(/\s/g, ''))}>Copy</Btn>
              </div>
              <div className="text-[12.5px] adm-t3 mt-0.5">WhatsApp: {waDigits.slice(-10) === digits.slice(-10) ? 'same number' : formatPhone(lead.whatsapp_phone)}{form.alt_phone ? ` · Alt: ${form.alt_phone}` : ''}</div>
            </div>
            <div className="w-full sm:w-[230px] space-y-2">
              <div className="rounded-xl bg-[#FE5100]/[0.08] p-4 text-center">
                <div className="text-[13px] font-semibold text-[#c2410c]">{cc.address || [cc.locality, lead.city].filter(Boolean).join(', ') || 'Address not known'}</div>
                {maps && <a href={maps} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-[#FE5100]">View on Maps ↗</a>}
              </div>
              {cc.rating && <div className="rounded-xl border adm-border px-3 py-2 text-[13px] adm-t1"><b>{cc.rating} ★</b> <span className="adm-t3">({cc.reviews || 0} reviews)</span></div>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t adm-border">
            <a href={`tel:+${digits}`} onClick={() => setRunning(true)} className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#FE5100] text-white hover:bg-[#e54900]">Open in dialer</a>
            {waDigits.length >= 10 && <a href={`https://wa.me/${waDigits.length === 10 ? `91${waDigits}` : waDigits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold adm-card adm-t2 adm-hoverable">WhatsApp chat</a>}
            <Btn variant="outline" onClick={() => setComm({ category: messageFor(cc.last_outcome, cc) || 'cold_call_interested', callbackAt: null, savedOutcome: null, afterSave: false })}>✉ Communicate</Btn>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12px] adm-t3">Call timer</span>
              <span className="text-[20px] font-extrabold adm-t1 tabular-nums">{fmtTimer(elapsed)}</span>
              <Btn size="sm" variant={running ? 'primary' : 'outline'} onClick={() => setRunning((r) => !r)}>{running ? 'Stop (T)' : 'Start (T)'}</Btn>
            </div>
          </div>
        </Card>

        <TabBar value={tab} onChange={setTab} tabs={[
          { value: 'details', label: 'Lead details' }, { value: 'pitch', label: 'Pitch & script' },
          { value: 'objections', label: `Objections${objection ? ' · 1' : ''}` }, { value: 'history', label: 'History' },
        ]} />

        {tab === 'details' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <SectionTitle right={dirty ? <Btn size="sm" onClick={saveDetails}>Save details</Btn> : <span className="text-[11.5px] adm-t3">Edit while you talk</span>}>Business information</SectionTitle>
              <div className="divide-y adm-border">
                {DETAIL_FIELDS.map(([k, label, ph]) => (
                  <label key={k} className="grid grid-cols-[130px_1fr] items-center gap-3 py-1.5 text-[13px]">
                    <span className="adm-t3">{label}</span>
                    <input className="fb-input text-sm w-full" value={form[k]} placeholder={ph || ''} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
                  </label>
                ))}
              </div>
              {site && <a href={site} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[12.5px] font-semibold text-[#FE5100]">Open website ↗</a>}
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <SectionTitle>Recent activity</SectionTitle>
                {history === null ? <Skeleton className="h-16" /> : history.length === 0 ? <div className="text-[13px] adm-t3">No previous calls.</div>
                  : history.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex gap-3 py-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FE5100] mt-1.5 shrink-0" />
                      <div className="min-w-0"><div className="text-[13px] adm-t1">{h.title}{h.body ? ` — ${h.body}` : ''}</div>
                        <div className="text-[11.5px] adm-t3">{new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div></div>
                    </div>
                  ))}
              </Card>
              <Card className="p-5">
                <SectionTitle>Why good fit</SectionTitle>
                <ul className="space-y-1.5 text-[13px] adm-t2">{fitReasons(lead).map((r) => <li key={r}>✓ {r}</li>)}</ul>
                <div className="text-[12px] adm-t3 mt-3">{[cc.priority && `Priority ${cc.priority}`, cc.fit && `fit ${cc.fit}`, cc.attempts ? `${cc.attempts} call${cc.attempts > 1 ? 's' : ''} so far` : null].filter(Boolean).join(' · ')}</div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'pitch' && (
          <Card className="p-5 space-y-4">
            {cc.pitch && <div className="rounded-xl bg-[#FE5100]/[0.07] p-4 text-[13.5px] adm-t1"><b>For this lead: </b>{cc.pitch}</div>}
            <ol className="space-y-3">
              {SCRIPT.map(([step, text], i) => (
                <li key={step} className="flex gap-3 text-[13.5px]"><span className="w-6 h-6 rounded-lg bg-[#FE5100] text-white text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div><b className="adm-t1">{step}.</b> <span className="adm-t2">{text}</span></div></li>
              ))}
            </ol>
          </Card>
        )}

        {tab === 'objections' && (
          <div className="grid gap-3 md:grid-cols-2">
            {OBJECTIONS.map((o) => {
              const on = objection === o.q;
              return (
                <Card key={o.q} className={`p-4 ${on ? '!border-[#FE5100]' : ''}`}>
                  <div className="font-semibold adm-t1 text-[13.5px]">“{o.q}”</div>
                  <div className="adm-t2 text-[13px] mt-1">{o.a}</div>
                  <Btn size="sm" variant={on ? 'primary' : 'outline'} className="mt-3" onClick={() => setObjection(on ? '' : o.q)}>{on ? '✓ They said this' : 'They said this'}</Btn>
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'history' && (
          <Card className="p-5">
            {history === null ? <Skeleton className="h-24" /> : history.length === 0 ? <div className="text-[13px] adm-t3">Nothing yet.</div>
              : history.map((h, i) => (
                <div key={i} className="py-2 border-b adm-border last:border-0">
                  <div className="text-[13px] adm-t1">{h.title}</div>
                  {h.body && <div className="text-[12.5px] adm-t2 whitespace-pre-wrap">{h.body}</div>}
                  <div className="text-[11.5px] adm-t3">{new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              ))}
          </Card>
        )}
      </div>

      {/* Right — outcome */}
      <div className="w-full xl:w-[320px] xl:shrink-0 space-y-4 order-2 xl:order-3">
        <Card className="p-4">
          <SectionTitle>Call outcome</SectionTitle>
          <div className="space-y-2">
            {OUTCOMES.map((o) => {
              const on = outcome === o.key;
              return (
                <button key={o.key} type="button" onClick={() => pick(o.key)}
                  className={`!min-h-0 w-full flex items-center gap-3 h-11 px-3 rounded-xl border text-[13.5px] text-left transition-colors ${on ? 'border-[#FE5100] bg-[#FE5100]/[0.07] text-[#c2410c] font-semibold' : 'adm-border adm-t1 adm-hoverable'}`}>
                  <span className={`w-6 h-6 rounded-lg text-[11.5px] font-bold flex items-center justify-center ${on ? 'bg-[#FE5100] text-white' : 'adm-chip'}`}>{o.hotkey}</span>{o.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle>{isCallback ? 'Call back at' : <>Schedule follow-up <span className="adm-t3 text-[12px] font-medium">(optional)</span></>}</SectionTitle>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {callbackPresets(new Date()).map((p) => (
              <Btn key={p.label} size="sm" variant={nextAt && +new Date(nextAt) === +p.at ? 'primary' : 'outline'} onClick={() => setNextAt(p.at.toISOString())}>{p.label}</Btn>
            ))}
          </div>
          <input type="datetime-local" className="fb-input text-sm w-full" aria-label="Follow-up date and time"
            value={nextAt ? toLocalInput(nextAt) : ''} onChange={(e) => setNextAt(e.target.value ? new Date(e.target.value).toISOString() : null)} />
          {nextAt && <button type="button" className="!min-h-0 text-[12px] adm-t3 mt-1" onClick={() => setNextAt(null)}>Clear</button>}
        </Card>

        <Card className="p-4">
          <SectionTitle>Call notes</SectionTitle>
          <textarea className="fb-input text-sm w-full" rows={4} placeholder="Notes from the call…" value={note} onChange={(e) => setNote(e.target.value)} />
        </Card>

        <div className="space-y-2">
          <Btn className="w-full justify-center !py-3" onClick={() => save(true)} disabled={!outcome || busy}>{busy ? 'Saving…' : 'Save call →'}</Btn>
          <Btn variant="outline" className="w-full justify-center" onClick={() => save(false)} disabled={!outcome || busy}>Save only (stay here)</Btn>
          <p className="text-[11.5px] adm-t3 text-center">After saving, the follow-up window opens for this outcome. Not interested / Wrong number go straight to the next lead.</p>
          <p className="text-[11.5px] adm-t3 text-center">Keys: 1–7 outcome · Enter save · T timer</p>
        </div>
      </div>

      {comm && (
        <ColdCallCommunicate lead={lead} templates={queue.templates || []} initialCategory={comm.category}
          callbackAt={comm.callbackAt} savedOutcome={comm.savedOutcome} afterSave={comm.afterSave}
          onClose={() => closeComm(false)} onDone={closeComm} onTemplatesChanged={reload} />
      )}
    </div>
  );
}

export default function ColdCallLead() {
  const { leadId } = useParams();
  const { queue, reload, now } = useOutletContext();
  const plan = useMemo(() => pendingPlan(queue), [queue]);
  const [lead, setLead] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setLead(null); setMissing(false);
    // GET /leads/:id answers { lead, notes, followUps }.
    crmGetLead(leadId).then(({ data }) => { if (alive) setLead(data?.lead || null); if (alive && !data?.lead) setMissing(true); })
      .catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [leadId]);

  if (missing) return <Card className="p-10 text-center adm-t3">Lead not found. <Link to={`${BASE}/today`} className="text-[#FE5100] font-semibold">Back to today's calls</Link></Card>;
  if (!lead) return <Skeleton className="h-96 rounded-2xl" />;
  return <LeadCall key={lead.id} initial={lead} plan={plan} queue={queue} reload={reload} now={now} />;
}
