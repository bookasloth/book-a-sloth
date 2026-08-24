import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Card, Btn, Badge } from '../../../components/admin/ui';
import {
  crmGetLead, crmLeadTimeline, crmLeadMessages, crmSetStatus, crmAddLeadNote, crmCreateFollowUp,
  crmCompleteFollowUp, crmAddTag, crmRemoveTag, crmSetDnc, crmLogCall, crmSendWhatsApp, crmSendEmail,
  crmListTemplates, crmListTags, crmCreateTag, crmUpdateLead,
  crmListSequences, crmEnroll,
} from '../../../services/api';
import { FUNNEL, STATUS_LABEL, STATUS_TONE, rupees, relTime, leadScore } from './salesConstants';
import { colorMap } from './salesTagColors';
import TagChip from './TagChip';
import TagPicker from './TagPicker';
import {
  Check, CheckCircle2, ChevronDown, Mail, Phone, MessageCircle, FileText,
  CalendarClock, Clock, Plus, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MSG_TONE = { sent: 'ok', delivered: 'ok', read: 'ok', queued: 'neutral', processing: 'neutral', failed: 'danger', bounced: 'danger', skipped: 'warn' };
const TABS = [['activity', 'Timeline'], ['messages', 'Messages'], ['notes', 'Notes'], ['followups', 'Follow-ups']];

// Funnel stages shown as the visual stepper (everything up to "Activated").
// "Won" (paid), "Lost" and DNC are terminal states, offered as buttons below.
const STEP_STAGES = FUNNEL.filter((s) => s !== 'paid');

const initialsOf = (name) => (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');

// Map a timeline entry to an icon + tint from its source/title (no new data).
function timelineIcon(item) {
  const s = `${item.source || ''} ${item.title || ''}`.toLowerCase();
  if (s.includes('whatsapp')) return { Icon: MessageCircle, cls: 'text-emerald-600 bg-emerald-50' };
  if (s.includes('email') || s.includes('mail')) return { Icon: Mail, cls: 'text-blue-600 bg-blue-50' };
  if (s.includes('call')) return { Icon: Phone, cls: 'text-slate-600 bg-slate-100' };
  if (s.includes('note')) return { Icon: FileText, cls: 'text-violet-600 bg-violet-50' };
  if (s.includes('status')) return { Icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' };
  if (s.includes('follow')) return { Icon: CalendarClock, cls: 'text-amber-600 bg-amber-50' };
  return { Icon: Clock, cls: 'text-slate-500 bg-slate-100' };
}

// Horizontal funnel stepper. Filled/checked up to the current stage; click any
// step to jump the lead there.
function Stepper({ status, onPick }) {
  const cur = STEP_STAGES.indexOf(status);
  return (
    <div className="flex items-start">
      {STEP_STAGES.map((s, i) => {
        const done = cur >= 0 && i <= cur;
        const isCur = i === cur;
        return (
          <Fragment key={s}>
            <button type="button" onClick={() => onPick(s)} className="flex flex-col items-center gap-1 shrink-0 w-11 group" title={STATUS_LABEL[s]}>
              <span className={`w-6 h-6 rounded-full grid place-items-center border-2 transition
                ${done ? 'bg-[#FE5100] border-[#FE5100] text-white' : 'adm-card border-gray-300 group-hover:border-[#FE5100]'}
                ${isCur ? 'ring-2 ring-[#FE5100]/30' : ''}`}>
                {done ? <Check size={13} /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
              </span>
              <span className={`text-[9px] leading-tight text-center ${isCur ? 'font-semibold text-[#FE5100]' : 'adm-t3'}`}>{STATUS_LABEL[s]}</span>
            </button>
            {i < STEP_STAGES.length - 1 && <span className={`h-0.5 flex-1 mt-3 ${i < cur ? 'bg-[#FE5100]' : 'bg-gray-200'}`} />}
          </Fragment>
        );
      })}
    </div>
  );
}

// Enrol this lead into an active drip sequence. Loads the list on first open;
// enrolment is idempotent server-side (per sequence+lead). Sends stay gated by
// the CRM kill-switch, so this only schedules — nothing goes out until that's on.
function EnrollControl({ leadId, onDone }) {
  const [open, setOpen] = useState(false);
  const [seqs, setSeqs] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open && seqs === null) {
      crmListSequences()
        .then(({ data }) => setSeqs((Array.isArray(data) ? data : []).filter((s) => s.is_active)))
        .catch(() => setSeqs([]));
    }
  }, [open, seqs]);
  const enroll = async (id) => {
    setBusy(true);
    try { await crmEnroll(leadId, id); toast.success('Enrolled in sequence'); setOpen(false); onDone?.(); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not enrol'); }
    finally { setBusy(false); }
  };
  return (
    <div className="relative inline-block">
      <Btn variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>Enrol</Btn>
      {open && (
        <div className="absolute z-20 mt-1 w-60 rounded-xl adm-card shadow-lg max-h-60 overflow-auto">
          {seqs === null ? <p className="px-3 py-2 text-[12px] adm-t3">Loading…</p>
            : seqs.length === 0 ? <p className="px-3 py-2 text-[12px] adm-t3">No active sequences. <a href="/admin/sales/sequences" className="text-[#FE5100]">Create one</a>.</p>
            : seqs.map((s) => (
              <button key={s.id} type="button" disabled={busy} onClick={() => enroll(s.id)}
                className="w-full text-left px-3 py-2 adm-hoverable text-[13px] adm-t1 disabled:opacity-50">{s.name}</button>
            ))}
        </div>
      )}
    </div>
  );
}

// Shared lead workspace — rendered both in the right-side drawer and on the
// full-page /leads/:id route. `onChanged` lets the parent list refresh.
export default function LeadPanel({ leadId, onChanged, onClose }) {
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('activity');
  const [modal, setModal] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [tagCatalog, setTagCatalog] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [editVal, setEditVal] = useState(false);
  const [valInput, setValInput] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      crmGetLead(leadId).then(({ data }) => { setLead(data.lead); setNotes(data.notes || []); setFollowUps(data.followUps || []); }),
      crmLeadTimeline(leadId).then(({ data }) => setTimeline(Array.isArray(data) ? data : [])).catch(() => setTimeline([])),
      crmLeadMessages(leadId).then(({ data }) => setMessages(Array.isArray(data) ? data : [])).catch(() => setMessages([])),
    ]).catch(() => setLead(null)).finally(() => setLoading(false));
  }, [leadId]);

  const loadTags = useCallback(() => crmListTags().then(({ data }) => setTagCatalog(Array.isArray(data) ? data : [])).catch(() => setTagCatalog([])), []);
  const refresh = () => { load(); onChanged?.(); };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { crmListTemplates().then(({ data }) => setTemplates(Array.isArray(data) ? data : [])).catch(() => setTemplates([])); loadTags(); }, [loadTags]);

  const setStatus = async (s) => { try { await crmSetStatus(leadId, s); toast.success(`Stage → ${STATUS_LABEL[s]}`); refresh(); } catch { toast.error('Failed'); } };
  const toggleDnc = async () => { try { await crmSetDnc(leadId, !lead.do_not_contact); refresh(); } catch { toast.error('Failed'); } };
  const removeTag = async (t) => { try { await crmRemoveTag(leadId, t); refresh(); } catch { toast.error('Failed'); } };
  const pickTag = async (name) => { try { await crmAddTag(leadId, name); setShowTagPicker(false); refresh(); } catch { toast.error('Failed'); } };
  const createTag = async (name, color) => { try { await crmCreateTag({ name, color }); await crmAddTag(leadId, name); setShowTagPicker(false); loadTags(); refresh(); } catch { toast.error('Could not create tag'); } };
  const completeFollowUp = async (fid) => { try { await crmCompleteFollowUp(fid); refresh(); } catch { toast.error('Failed'); } };
  const saveValue = async () => {
    const rupeesNum = Math.max(0, Math.round(Number(valInput) || 0));
    try { await crmUpdateLead(leadId, { expected_value_paise: rupeesNum * 100 }); setEditVal(false); refresh(); }
    catch { toast.error('Failed'); }
  };

  if (loading && !lead) return <div className="p-6"><p className="adm-t3">Loading…</p></div>;
  if (!lead) return <div className="p-6"><p className="adm-t3">Lead not found. <Link to="/admin/sales/leads" className="text-[#FE5100]">Back</Link></p></div>;

  const tagColors = colorMap(tagCatalog);
  const { score, temp } = leadScore(lead);
  const scoreTone = temp === 'hot' ? 'text-red-500' : temp === 'warm' ? 'text-amber-600' : 'adm-t3';
  const nextFu = [...followUps].sort((a, b) => new Date(a.due_at) - new Date(b.due_at))[0];

  return (
    <div>
      <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-6">
        {/* ── LEFT: identity + stage + actions ── */}
        <div className="space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FE5100]/10 text-[#FE5100] grid place-items-center font-bold text-base shrink-0">
              {initialsOf(lead.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold adm-t1 truncate">{lead.name || 'Unnamed lead'}</h1>
                <Badge tone={STATUS_TONE[lead.status] || 'neutral'}>{STATUS_LABEL[lead.status] || lead.status}</Badge>
                {lead.do_not_contact && <Badge tone="danger">DNC</Badge>}
                <span className={`text-[12px] font-bold ${scoreTone}`} title={`Lead score (${temp})`}>{temp === 'hot' ? '🔥' : ''}{score}</span>
              </div>
              {lead.business_name && <p className="text-[13px] adm-t2 mt-0.5 truncate">{lead.business_name}{lead.profession ? ` · ${lead.profession}` : ''}</p>}
              <div className="mt-1.5 space-y-0.5 text-[12px] adm-t2">
                {lead.phone && <p className="flex items-center gap-1.5"><Phone size={12} className="adm-t3" />{lead.phone}</p>}
                {lead.email && <p className="flex items-center gap-1.5 truncate"><Mail size={12} className="adm-t3" />{lead.email}</p>}
                <p className="flex items-center gap-1.5 adm-t3"><Clock size={12} />Source: {lead.source}{lead.city ? ` · ${lead.city}` : ''}</p>
              </div>
              {lead.profile_id && <Link to={`/admin/host360/${lead.profile_id}`} className="inline-flex items-center gap-1 text-[11px] text-[#FE5100] mt-1">Host 360 <ArrowRight size={11} /></Link>}
            </div>
          </div>

          {/* Revenue + deal value */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] adm-t3 uppercase tracking-wide">Revenue</p>
              <p className="text-base font-bold adm-t1 mt-0.5">{rupees(lead.revenue_paise)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] adm-t3 uppercase tracking-wide">Deal value</p>
              {editVal ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[12px] adm-t3">₹</span>
                  <input autoFocus type="number" className="fb-input text-sm w-full py-0.5" value={valInput}
                    onChange={(e) => setValInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveValue()} onBlur={saveValue} />
                </div>
              ) : (
                <button onClick={() => { setValInput(String(Math.round((lead.expected_value_paise || 0) / 100))); setEditVal(true); }}
                  className="text-base font-bold adm-t1 hover:text-[#FE5100] mt-0.5 block">
                  {lead.expected_value_paise ? rupees(lead.expected_value_paise) : 'Set ✎'}
                </button>
              )}
            </div>
          </div>

          {/* Stage stepper + terminal states */}
          <div>
            <p className="text-[10px] adm-t3 uppercase tracking-wide font-semibold mb-2">Stage</p>
            <Stepper status={lead.status} onPick={setStatus} />
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => setStatus('paid')}
                className={`text-[12px] px-3 py-1.5 rounded-lg border transition ${lead.status === 'paid' ? 'bg-emerald-600 text-white border-emerald-600' : 'adm-t2 border-gray-200 hover:border-emerald-500'}`}>Won</button>
              <button onClick={() => setStatus('lost')}
                className={`text-[12px] px-3 py-1.5 rounded-lg border transition ${lead.status === 'lost' ? 'bg-red-600 text-white border-red-600' : 'adm-t2 border-gray-200 hover:border-red-400'}`}>Lost</button>
              <button onClick={toggleDnc}
                className={`text-[12px] px-3 py-1.5 rounded-lg border transition ${lead.do_not_contact ? 'bg-red-600 text-white border-red-600' : 'adm-t2 border-gray-200 hover:border-red-400'}`}>{lead.do_not_contact ? 'Clear DNC' : 'Do Not Contact'}</button>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <p className="text-[10px] adm-t3 uppercase tracking-wide font-semibold mb-2">Quick actions</p>
            <div className="grid grid-cols-3 gap-2">
              <QuickAction primary icon={MessageCircle} label="WhatsApp" onClick={() => setModal('wa')} />
              <QuickAction icon={Mail} label="Email" onClick={() => setModal('email')} />
              <QuickAction icon={Phone} label="Call" onClick={() => setModal('call')} />
            </div>
            <div className="flex gap-2 mt-2">
              <AddActivityMenu onPick={setModal} />
              <EnrollControl leadId={lead.id} onDone={refresh} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] adm-t3 uppercase tracking-wide font-semibold mb-2">Tags</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {(lead.tags || []).map((t) => <TagChip key={t} name={t} color={tagColors[t]} onRemove={() => removeTag(t)} />)}
              <div className="relative">
                <button type="button" onClick={() => setShowTagPicker((v) => !v)}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-gray-300 adm-t3 hover:border-[#FE5100]">+ Tag</button>
                {showTagPicker && <TagPicker tags={tagCatalog} exclude={lead.tags || []} onSelect={pickTag} onCreate={createTag} onClose={() => setShowTagPicker(false)} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: next action + timeline ── */}
        <div className="min-w-0">
          {/* Next action banner */}
          <div className="rounded-xl border border-gray-200 p-3.5 flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-[#FE5100]/10 text-[#FE5100] grid place-items-center shrink-0"><CalendarClock size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#FE5100] uppercase tracking-wide font-semibold">Next action</p>
              {nextFu ? (
                <>
                  <p className="text-[14px] font-semibold adm-t1 truncate">{nextFu.title || 'Follow up'}</p>
                  <p className={`text-[12px] ${new Date(nextFu.due_at) < new Date() ? 'text-red-500' : 'adm-t3'}`}>{fmtDateTime(nextFu.due_at)}</p>
                </>
              ) : <p className="text-[13px] adm-t3 mt-0.5">Nothing scheduled.</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Btn variant="outline" size="sm" onClick={() => setModal('followup')}>{nextFu ? 'Edit' : 'Schedule'}</Btn>
              {nextFu && <Btn size="sm" onClick={() => completeFollowUp(nextFu.id)}><Check size={14} /> Mark done</Btn>}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-gray-100">
            {TABS.map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`text-[13px] px-3 py-2 -mb-px border-b-2 transition ${tab === k ? 'border-[#FE5100] text-[#FE5100] font-semibold' : 'border-transparent adm-t2 hover:adm-t1'}`}>
                {label}{k === 'notes' && notes.length ? ` (${notes.length})` : ''}{k === 'followups' && followUps.length ? ` (${followUps.length})` : ''}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {tab === 'activity' && (
              timeline.length === 0 ? <p className="adm-t3 text-sm">No activity yet.</p> : (
                <ol className="space-y-1">
                  {timeline.map((t, i) => {
                    const { Icon, cls } = timelineIcon(t);
                    const last = i === timeline.length - 1;
                    return (
                      <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${cls}`}><Icon size={14} /></span>
                          {!last && <span className="w-px flex-1 bg-gray-200 my-1" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-semibold adm-t1">{t.title}</p>
                            <span className="text-[11px] adm-t3 flex-shrink-0 whitespace-nowrap">{relTime(t.at)}</span>
                          </div>
                          {t.body && <p className="text-[12px] adm-t2 mt-0.5">{t.body}</p>}
                          {t.status && <span className="text-[10px] adm-t3">{t.source} · {t.status}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )
            )}

            {tab === 'messages' && (
          messages.length === 0 ? <p className="adm-t3 text-sm">No messages sent yet.</p> : (
            <ul className="space-y-2">
              {messages.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50">
                  <div className="min-w-0">
                    <p className="text-[13px] adm-t1"><span className="uppercase text-[10px] adm-t3 mr-1">{m.channel}</span>{m.subject || m.template_key || m.body_preview || '—'}</p>
                    {m.error && <p className="text-[11px] text-red-500">{m.error}</p>}
                    <p className="text-[11px] adm-t3">{relTime(m.created_at)}</p>
                  </div>
                  <Badge tone={MSG_TONE[m.status] || 'neutral'}>{m.status}</Badge>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'notes' && (
          notes.length === 0 ? <p className="adm-t3 text-sm">No notes.</p> : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="text-[13px] adm-t2"><p>{n.body}</p><p className="text-[11px] adm-t3 mt-0.5">{relTime(n.created_at)}</p></li>
              ))}
            </ul>
          )
        )}

        {tab === 'followups' && (
          followUps.length === 0 ? <p className="adm-t3 text-sm">None open.</p> : (
            <ul className="space-y-2">
              {followUps.map((f) => {
                const overdue = new Date(f.due_at) < new Date();
                return (
                  <li key={f.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0"><p className="text-[13px] adm-t2 truncate">{f.title}</p><p className={`text-[11px] ${overdue ? 'text-red-500' : 'adm-t3'}`}>{relTime(f.due_at)}</p></div>
                    <Btn variant="outline" size="sm" onClick={() => completeFollowUp(f.id)}>Done</Btn>
                  </li>
                );
              })}
            </ul>
          )
        )}
          </div>
        </div>
      </div>

      {/* Footer meta */}
      <div className="mt-6 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] adm-t3">
        <span>Created {fmtDateTime(lead.created_at)}</span>
        <span>Last updated {relTime(lead.last_activity_at || lead.updated_at || lead.created_at)}</span>
      </div>

      {modal && <ActionModal type={modal} lead={lead} templates={templates} onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />}
    </div>
  );
}

// Small dropdown for lower-frequency activities (note / follow-up) so the quick
// actions row stays to the three primary channels.
function AddActivityMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  const pick = (t) => { setOpen(false); onPick(t); };
  return (
    <div className="relative flex-1">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium adm-card adm-t2 adm-hoverable rounded-lg px-3 py-1.5">
        <Plus size={13} /> Add activity <ChevronDown size={13} className="adm-t3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-44 rounded-xl adm-card shadow-lg overflow-hidden">
            <button type="button" onClick={() => pick('note')} className="w-full text-left px-3 py-2 adm-hoverable text-[13px] adm-t1 flex items-center gap-2"><FileText size={14} className="adm-t3" /> Add note</button>
            <button type="button" onClick={() => pick('followup')} className="w-full text-left px-3 py-2 adm-hoverable text-[13px] adm-t1 flex items-center gap-2"><CalendarClock size={14} className="adm-t3" /> Schedule follow-up</button>
            <button type="button" onClick={() => pick('call')} className="w-full text-left px-3 py-2 adm-hoverable text-[13px] adm-t1 flex items-center gap-2"><Phone size={14} className="adm-t3" /> Log call</button>
          </div>
        </>
      )}
    </div>
  );
}

// Prominent single-channel action tile used in the "Quick actions" grid.
function QuickAction({ icon: Icon, label, onClick, primary }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 transition
        ${primary ? 'bg-[#FE5100] text-white border-[#FE5100] hover:bg-[#e54900]' : 'adm-card adm-t2 border-gray-200 hover:border-[#FE5100]'}`}>
      <Icon size={17} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

// ── Composer bits (shared) ────────────────────────────────────
function leadValueFor(key, lead) {
  const first = (lead.name || '').trim().split(/\s+/)[0] || '';
  const map = { first_name: first, name: lead.name || '', business_name: lead.business_name || '', profession: lead.profession || '', city: lead.city || '', email: lead.email || '', phone: lead.phone || '' };
  return map[key] ?? '';
}

function Combobox({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q ? options : options.filter((o) => (o.label + ' ' + (o.hint || '')).toLowerCase().includes(q));
  }, [options, query]);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="fb-input text-sm w-full text-left flex items-center justify-between">
        <span className={selected ? 'adm-t1' : 'adm-t3'}>{selected ? selected.label : (placeholder || 'Select…')}</span><span className="adm-t3">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-xl adm-card shadow-lg max-h-64 overflow-auto">
          <div className="p-2 sticky top-0 adm-card"><input autoFocus className="fb-input text-sm w-full" placeholder="Search templates…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          {filtered.length === 0 ? <p className="px-3 py-2 text-[12px] adm-t3">No templates. Add some in Templates.</p> :
            filtered.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }} className="w-full text-left px-3 py-2 adm-hoverable">
                <p className="text-[13px] adm-t1">{o.label}</p>{o.hint && <p className="text-[11px] adm-t3">{o.hint}</p>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function ActionModal({ type, lead, templates = [], onClose, onDone }) {
  const id = lead.id;
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({ body: '', title: '', dueAt: '', outcome: '', durationMin: '', subject: '', html: '' });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const waTemplates = useMemo(() => templates.filter((t) => t.channel === 'whatsapp'), [templates]);
  const emailTemplates = useMemo(() => templates.filter((t) => t.channel === 'email'), [templates]);
  const [tplId, setTplId] = useState('');
  const [vars, setVars] = useState({});
  const tpl = (type === 'wa' ? waTemplates : emailTemplates).find((t) => t.id === tplId) || null;

  const pickTemplate = (newId) => {
    setTplId(newId);
    const t = (type === 'wa' ? waTemplates : emailTemplates).find((x) => x.id === newId);
    if (!t) return;
    if (type === 'wa') { const seed = {}; (t.variables || []).forEach((d) => { seed[d.key] = leadValueFor(d.key, lead); }); setVars(seed); }
    else setV((s) => ({ ...s, subject: t.subject || '', html: t.body || '' }));
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (type === 'note') await crmAddLeadNote(id, v.body);
      else if (type === 'call') await crmLogCall(id, { outcome: v.outcome, durationMin: Number(v.durationMin) || null, body: v.body });
      else if (type === 'followup') await crmCreateFollowUp(id, { title: v.title, dueAt: v.dueAt || new Date(Date.now() + 864e5).toISOString(), remind: true });
      else if (type === 'wa') {
        if (!tpl) { toast.error('Pick a template'); setBusy(false); return; }
        const params = (tpl.variables || []).map((d) => vars[d.key] ?? '');
        const r = await crmSendWhatsApp(id, { templateKey: tpl.name, params });
        toast[r.data?.status === 'skipped' ? 'error' : 'success'](r.data?.status === 'skipped' ? `Skipped: ${r.data.error}` : 'WhatsApp queued');
        onDone(); return;
      } else if (type === 'email') {
        if (!v.subject || !v.html) { toast.error('Subject and body required'); setBusy(false); return; }
        const r = await crmSendEmail(id, { subject: v.subject, html: v.html });
        toast[r.data?.status === 'skipped' ? 'error' : 'success'](r.data?.status === 'skipped' ? `Skipped: ${r.data.error}` : 'Email queued');
        onDone(); return;
      }
      toast.success('Saved'); onDone();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };

  const T = { note: 'Add note', call: 'Log call', followup: 'Add follow-up', wa: 'Send WhatsApp', email: 'Send email' }[type];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-auto">
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold adm-t1">{T}</h2><button onClick={onClose} className="adm-t3 text-xl leading-none">×</button></div>
          <div className="space-y-3">
            {type === 'note' && <textarea className="fb-input text-sm w-full" rows={4} placeholder="Internal note…" value={v.body} onChange={set('body')} />}
            {type === 'call' && <>
              <input className="fb-input text-sm w-full" placeholder="Outcome (e.g. Interested)" value={v.outcome} onChange={set('outcome')} />
              <input className="fb-input text-sm w-full" placeholder="Duration (min)" value={v.durationMin} onChange={set('durationMin')} />
              <textarea className="fb-input text-sm w-full" rows={2} placeholder="Notes" value={v.body} onChange={set('body')} />
            </>}
            {type === 'followup' && <>
              <input className="fb-input text-sm w-full" placeholder="What to do" value={v.title} onChange={set('title')} />
              <input type="datetime-local" className="fb-input text-sm w-full" value={v.dueAt} onChange={set('dueAt')} />
            </>}
            {type === 'wa' && (waTemplates.length === 0 ? (
              <p className="text-[13px] adm-t2">No approved WhatsApp templates yet. Add them in <a href="/admin/sales/templates" className="text-[#FE5100]">Templates</a> first.</p>
            ) : <>
              <div><label className="block text-[11px] font-medium adm-t2 mb-1">Template</label>
                <Combobox placeholder="Pick a WhatsApp template" value={tplId} onChange={pickTemplate}
                  options={waTemplates.map((t) => ({ value: t.id, label: t.label, hint: `${t.name} · ${(t.variables || []).length} var(s)` }))} />
              </div>
              {tpl && (tpl.variables || []).length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] adm-t3">Fill each slot (prefilled from the lead). Sent to AiSensy in order.</p>
                  {tpl.variables.map((d, i) => (
                    <div key={d.key || i}>
                      <label className="block text-[11px] font-medium adm-t2 mb-0.5">{i + 1}. {d.label || d.key}</label>
                      <input className="fb-input text-sm w-full" value={vars[d.key] ?? ''} placeholder={d.example || ''} onChange={(e) => setVars({ ...vars, [d.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] adm-t3">Delivery is gated by the CRM kill-switch — off = recorded, not sent.</p>
            </>)}
            {type === 'email' && <>
              {emailTemplates.length > 0 && (
                <div><label className="block text-[11px] font-medium adm-t2 mb-1">Start from a template (optional)</label>
                  <Combobox placeholder="Blank email" value={tplId} onChange={pickTemplate} options={emailTemplates.map((t) => ({ value: t.id, label: t.label, hint: t.subject || '' }))} />
                </div>
              )}
              <input className="fb-input text-sm w-full" placeholder="Subject" value={v.subject} onChange={set('subject')} />
              <textarea className="fb-input text-sm w-full" rows={6} placeholder="HTML body — {{first_name}}, {{business_name}} supported" value={v.html} onChange={set('html')} />
            </>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="outline" size="sm" onClick={onClose}>Cancel</Btn>
            <Btn size="sm" onClick={submit} disabled={busy}>{busy ? 'Working…' : 'Confirm'}</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
