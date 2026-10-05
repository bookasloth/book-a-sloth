import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Btn, Badge } from '../../../components/admin/ui';
import { crmColdCallOutcome, crmColdCallRemind, crmLeadTimeline, crmUpdateTemplate } from '../../../services/api';
import { OUTCOMES, OBJECTIONS, sendResultMessage, callbackPresets, formatPhone, fmtTimer, isTypingTarget } from './coldCallUtils';

const toLocalInput = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

function CallbackPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {callbackPresets(new Date()).map((p) => (
        <Btn key={p.label} size="sm" variant={value && +new Date(value) === +p.at ? 'primary' : 'outline'} onClick={() => onChange(p.at.toISOString())}>{p.label}</Btn>
      ))}
      <input type="datetime-local" className="fb-input text-sm" aria-label="Callback date and time"
        value={value ? toLocalInput(value) : ''} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />
    </div>
  );
}

export default function ColdCallCard({ lead, templates, onDone, onChanged }) {
  const cc = lead.attributes?.cold_call || {};
  const [outcome, setOutcome] = useState(null);
  const [note, setNote] = useState('');
  const [email, setEmail] = useState(lead.email || '');
  const [editEmail, setEditEmail] = useState(false);
  const [send, setSend] = useState({ email: false, whatsapp: false });
  const [callbackAt, setCallbackAt] = useState(null);
  const [remindOpen, setRemindOpen] = useState(false);
  const [remindAt, setRemindAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const saveRef = useRef(null);

  const tplFor = (channel, category) => templates.find((t) => t.channel === channel && t.category === category);
  const picked = OUTCOMES.find((o) => o.key === outcome);

  useEffect(() => {
    crmLeadTimeline(lead.id).then(({ data }) => setHistory((Array.isArray(data) ? data : []).slice(0, 5))).catch(() => setHistory([]));
  }, [lead.id]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const pick = (key) => {
    const o = OUTCOMES.find((x) => x.key === key);
    setOutcome(key);
    const e = o.template && tplFor('email', o.template);
    const w = o.template && tplFor('whatsapp', o.template);
    setSend({ email: !!(e?.is_active && (email || lead.email)), whatsapp: !!w?.is_active });
    if (key !== 'callback') setCallbackAt(null);
  };

  const save = async () => {
    if (!outcome || busy) return;
    if (outcome === 'callback' && !callbackAt) { toast.error('Pick a callback time'); return; }
    setBusy(true);
    try {
      const { data } = await crmColdCallOutcome(lead.id, {
        outcome, note, durationSec: elapsed || null, callbackAt,
        send: picked?.template ? send : {},
        email: email && email !== lead.email ? email : undefined,
      });
      for (const [ch, r] of Object.entries(data?.sends || {})) {
        const m = sendResultMessage(ch, r);
        if (m.kind === 'success') toast.success(m.text); else if (m.kind === 'info') toast(m.text); else toast.error(m.text);
      }
      for (const w of data?.warnings || []) toast(w);
      onDone(lead.id);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save the call');
    } finally { setBusy(false); }
  };
  saveRef.current = save;

  useEffect(() => {
    const onKey = (e) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const o = OUTCOMES.find((x) => x.hotkey === e.key);
      if (o) { e.preventDefault(); pick(o.key); return; }
      if (e.key === 'Enter') { e.preventDefault(); saveRef.current?.(); return; }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); setRunning((r) => !r); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const setReminder = async () => {
    if (!remindAt) return;
    try { await crmColdCallRemind(lead.id, { at: remindAt, note }); toast.success('Reminder set'); setRemindOpen(false); onChanged(); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not set reminder'); }
  };

  const approve = async (tpl) => {
    try { await crmUpdateTemplate(tpl.id, { is_active: true }); toast.success('Marked approved'); onChanged(); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not update template'); }
  };

  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success('Copied')).catch(() => {});
  const waSame = (lead.whatsapp_phone || '').slice(-10) === (lead.phone || '').slice(-10);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[18px] font-bold adm-t1 truncate">{lead.business_name || lead.name || 'Unnamed lead'}</div>
          <div className="text-[13px] adm-t3">{[lead.profession, cc.locality, lead.city].filter(Boolean).join(' · ')}</div>
        </div>
        <div className="flex items-center gap-2">
          {cc.fit && <Badge tone="ok">Fit {cc.fit}</Badge>}
          {cc.day && <Badge tone="neutral">{cc.day}{cc.priority ? ` · #${cc.priority}` : ''}</Badge>}
          {cc.attempts > 0 && <Badge tone="info">Attempt {cc.attempts + 1}</Badge>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a href={`tel:+${String(lead.phone || '').replace(/\D/g, '')}`} className="text-[24px] font-bold adm-t1 tracking-wide">{formatPhone(lead.phone)}</a>
        <Btn size="sm" variant="outline" onClick={() => copy(formatPhone(lead.phone).replace(/\s/g, ''))}>Copy</Btn>
        <Btn size="sm" variant={running ? 'primary' : 'outline'} onClick={() => setRunning((r) => !r)}>{running ? `⏸ ${fmtTimer(elapsed)}` : `▶ Timer ${elapsed ? fmtTimer(elapsed) : ''}`}</Btn>
        <span className="text-[12.5px] adm-t3">WhatsApp: {waSame ? 'same number' : formatPhone(lead.whatsapp_phone)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="adm-t3">Email:</span>
        {editEmail
          ? <input autoFocus className="fb-input text-sm w-64" value={email} placeholder="name@business.com" onChange={(e) => setEmail(e.target.value)} onBlur={() => setEditEmail(false)} />
          : <><span className="adm-t2">{email || 'none (ask on the call)'}</span><Btn size="sm" variant="ghost" onClick={() => setEditEmail(true)}>Edit</Btn></>}
      </div>

      {cc.pitch && <div className="rounded-xl adm-card p-3 text-[13px] adm-t2"><span className="font-semibold adm-t1">Pitch: </span><span>{cc.pitch}</span></div>}

      <details className="text-[13px]">
        <summary className="cursor-pointer adm-t2 font-medium">Objection answers</summary>
        <ul className="mt-2 space-y-2">
          {OBJECTIONS.map((o) => <li key={o.q}><div className="font-medium adm-t1">“{o.q}”</div><div className="adm-t3">{o.a}</div></li>)}
        </ul>
      </details>

      {history.length > 0 && (
        <div className="text-[12.5px] space-y-1">
          <div className="adm-t3 uppercase text-[11px] tracking-wide">History</div>
          {history.map((h, i) => <div key={i} className="adm-t2">{new Date(h.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {h.title}{h.body ? ` — ${h.body}` : ''}</div>)}
        </div>
      )}

      <textarea className="fb-input text-sm w-full" rows={3} placeholder="Notes from the call…" value={note} onChange={(e) => setNote(e.target.value)} />

      <div>
        <div className="adm-t3 uppercase text-[11px] tracking-wide mb-2">Outcome</div>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <Btn key={o.key} size="sm" variant={outcome === o.key ? 'primary' : 'outline'} onClick={() => pick(o.key)}>
              <span className="adm-t3 text-[11px]">{o.hotkey}</span> {o.label}
            </Btn>
          ))}
        </div>
      </div>

      {outcome === 'callback' && <CallbackPicker value={callbackAt} onChange={setCallbackAt} />}

      {picked?.template && (
        <div className="space-y-1 text-[13px]">
          <div className="adm-t3 uppercase text-[11px] tracking-wide">Follow-up</div>
          {['email', 'whatsapp'].map((ch) => {
            const tpl = tplFor(ch, picked.template);
            const pending = ch === 'whatsapp' && tpl && !tpl.is_active;
            const noEmail = ch === 'email' && !(email || lead.email);
            return (
              <label key={ch} className="flex items-center gap-2">
                <input type="checkbox" disabled={!tpl || pending || noEmail} checked={!!send[ch]} onChange={(e) => setSend((s) => ({ ...s, [ch]: e.target.checked }))} />
                <span className="adm-t2">{ch === 'email' ? 'Email' : 'WhatsApp'} — {tpl?.label || 'no template'}</span>
                {pending && <><Badge tone="warn">pending AiSensy</Badge><Btn size="sm" variant="ghost" onClick={() => approve(tpl)}>Mark approved</Btn></>}
                {noEmail && <Badge tone="neutral">no email</Badge>}
              </label>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <Btn size="sm" variant="ghost" onClick={() => setRemindOpen((v) => !v)}>⏰ Remind me</Btn>
          {remindOpen && <><CallbackPicker value={remindAt} onChange={setRemindAt} /><Btn size="sm" onClick={setReminder} disabled={!remindAt}>Set</Btn></>}
        </div>
        <Btn onClick={save} disabled={!outcome || busy}>{busy ? 'Saving…' : 'Save & next →'}</Btn>
      </div>
    </Card>
  );
}
