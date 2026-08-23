import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Btn, Badge } from '../../../components/admin/ui';
import {
  crmGetLead, crmLeadTimeline, crmSetStatus, crmAddLeadNote, crmCreateFollowUp,
  crmAddTag, crmRemoveTag, crmSetDnc, crmLogCall, crmSendWhatsApp, crmSendEmail,
} from '../../../services/api';
import { ALL_STATUSES, STATUS_LABEL, STATUS_TONE, rupees, relTime } from './salesConstants';
import toast from 'react-hot-toast';

export default function SalesLeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'note'|'followup'|'wa'|'email'|'call'|'tag'

  const load = useCallback(() => {
    Promise.all([
      crmGetLead(id).then(({ data }) => { setLead(data.lead); setNotes(data.notes || []); setFollowUps(data.followUps || []); }),
      crmLeadTimeline(id).then(({ data }) => setTimeline(Array.isArray(data) ? data : [])).catch(() => setTimeline([])),
    ]).catch(() => setLead(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (status) => {
    try { await crmSetStatus(id, status); toast.success(`Status → ${STATUS_LABEL[status]}`); load(); }
    catch { toast.error('Failed'); }
  };
  const toggleDnc = async () => {
    try { await crmSetDnc(id, !lead.do_not_contact); load(); } catch { toast.error('Failed'); }
  };
  const removeTag = async (t) => { try { await crmRemoveTag(id, t); load(); } catch { toast.error('Failed'); } };

  if (loading) return <div className="p-6"><p className="adm-t3">Loading…</p></div>;
  if (!lead) return <div className="p-6"><p className="adm-t3">Lead not found. <Link to="/admin/sales/leads" className="text-[#FE5100]">Back</Link></p></div>;

  return (
    <div className="p-6 max-w-6xl">
      <Link to="/admin/sales/leads" className="text-[12px] text-[#FE5100] font-semibold">← All leads</Link>

      {/* Header */}
      <Card className="rounded-2xl p-5 mt-2 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold adm-t1">{lead.name || 'Unnamed lead'}</h1>
              <Badge tone={STATUS_TONE[lead.status] || 'neutral'}>{STATUS_LABEL[lead.status] || lead.status}</Badge>
              {lead.do_not_contact && <Badge tone="danger">DNC</Badge>}
            </div>
            {lead.business_name && <p className="adm-t2 mt-0.5">{lead.business_name}{lead.profession ? ` · ${lead.profession}` : ''}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[13px] adm-t2">
              {lead.phone && <span>📱 {lead.phone}</span>}
              {lead.email && <span>✉️ {lead.email}</span>}
              {lead.city && <span>📍 {lead.city}</span>}
              <span className="adm-t3">Source: {lead.source}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] adm-t3 uppercase">Revenue</p>
            <p className="text-lg font-bold adm-t1">{rupees(lead.revenue_paise)}</p>
            {lead.profile_id && <Link to={`/admin/host360/${lead.profile_id}`} className="text-[11px] text-[#FE5100]">Open Host 360 →</Link>}
          </div>
        </div>

        {/* Status pipeline picker */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${lead.status === s ? 'bg-[#FE5100] text-white border-[#FE5100]' : 'adm-t2 border-gray-200 hover:border-[#FE5100]'}`}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          <Btn size="sm" onClick={() => setModal('wa')}>Send WhatsApp</Btn>
          <Btn size="sm" onClick={() => setModal('email')}>Send Email</Btn>
          <Btn variant="outline" size="sm" onClick={() => setModal('call')}>Log Call</Btn>
          <Btn variant="outline" size="sm" onClick={() => setModal('note')}>Add Note</Btn>
          <Btn variant="outline" size="sm" onClick={() => setModal('followup')}>Add Follow-up</Btn>
          <Btn variant="outline" size="sm" onClick={() => setModal('tag')}>Add Tag</Btn>
          <Btn variant="outline" size="sm" onClick={toggleDnc}>{lead.do_not_contact ? 'Clear DNC' : 'Do Not Contact'}</Btn>
        </div>

        {lead.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {lead.tags.map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full adm-chip flex items-center gap-1">
                {t}<button onClick={() => removeTag(t)} className="adm-t3">×</button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <Card className="lg:col-span-2 rounded-2xl p-5">
          <h2 className="font-bold adm-t1 mb-4">Timeline</h2>
          {timeline.length === 0 ? <p className="adm-t3 text-sm">No activity yet.</p> : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {timeline.map((t, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-[#FE5100]" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold adm-t1">{t.title}</p>
                    <span className="text-[11px] adm-t3 flex-shrink-0">{relTime(t.at)}</span>
                  </div>
                  {t.body && <p className="text-[12px] adm-t2 mt-0.5">{t.body}</p>}
                  {t.status && <span className="text-[10px] adm-t3">{t.source} · {t.status}</span>}
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Notes + follow-ups */}
        <div className="space-y-4">
          <Card className="rounded-2xl p-5">
            <h2 className="font-bold adm-t1 mb-3">Follow-ups</h2>
            {followUps.length === 0 ? <p className="adm-t3 text-sm">None open.</p> : (
              <ul className="space-y-2">
                {followUps.map((f) => (
                  <li key={f.id} className="text-[13px] adm-t2 flex items-center justify-between gap-2">
                    <span className="truncate">{f.title}</span>
                    <span className="text-[11px] adm-t3">{relTime(f.due_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="rounded-2xl p-5">
            <h2 className="font-bold adm-t1 mb-3">Notes</h2>
            {notes.length === 0 ? <p className="adm-t3 text-sm">No notes.</p> : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="text-[13px] adm-t2">
                    <p>{n.body}</p>
                    <p className="text-[11px] adm-t3 mt-0.5">{relTime(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {modal && <ActionModal type={modal} lead={lead} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
}

function ActionModal({ type, lead, onClose, onDone }) {
  const id = lead.id;
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({ body: '', title: '', dueAt: '', templateKey: '', params: '', subject: '', html: '', outcome: '', durationMin: '', tag: '' });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    try {
      if (type === 'note') await crmAddLeadNote(id, v.body);
      else if (type === 'tag') await crmAddTag(id, v.tag.trim());
      else if (type === 'call') await crmLogCall(id, { outcome: v.outcome, durationMin: Number(v.durationMin) || null, body: v.body });
      else if (type === 'followup') await crmCreateFollowUp(id, { title: v.title, dueAt: v.dueAt || new Date(Date.now() + 864e5).toISOString(), remind: true });
      else if (type === 'wa') { const r = await crmSendWhatsApp(id, { templateKey: v.templateKey.trim(), params: v.params ? v.params.split('|').map((s) => s.trim()) : [] }); toast[r.data?.status === 'skipped' ? 'error' : 'success'](r.data?.status === 'skipped' ? `Skipped: ${r.data.error}` : 'WhatsApp queued'); onDone(); return; }
      else if (type === 'email') { const r = await crmSendEmail(id, { subject: v.subject, html: v.html }); toast[r.data?.status === 'skipped' ? 'error' : 'success'](r.data?.status === 'skipped' ? `Skipped: ${r.data.error}` : 'Email queued'); onDone(); return; }
      toast.success('Saved');
      onDone();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };

  const T = { note: 'Add note', tag: 'Add tag', call: 'Log call', followup: 'Add follow-up', wa: 'Send WhatsApp', email: 'Send email' }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="rounded-2xl p-5 w-full max-w-lg" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold adm-t1">{T}</h2>
            <button onClick={onClose} className="adm-t3 text-xl leading-none">×</button>
          </div>

          <div className="space-y-3">
            {type === 'note' && <textarea className="fb-input text-sm w-full" rows={4} placeholder="Internal note…" value={v.body} onChange={set('body')} />}
            {type === 'tag' && <input className="fb-input text-sm w-full" placeholder="Tag" value={v.tag} onChange={set('tag')} />}
            {type === 'call' && <>
              <input className="fb-input text-sm w-full" placeholder="Outcome (e.g. Interested)" value={v.outcome} onChange={set('outcome')} />
              <input className="fb-input text-sm w-full" placeholder="Duration (min)" value={v.durationMin} onChange={set('durationMin')} />
              <textarea className="fb-input text-sm w-full" rows={2} placeholder="Notes" value={v.body} onChange={set('body')} />
            </>}
            {type === 'followup' && <>
              <input className="fb-input text-sm w-full" placeholder="What to do" value={v.title} onChange={set('title')} />
              <input type="datetime-local" className="fb-input text-sm w-full" value={v.dueAt} onChange={set('dueAt')} />
            </>}
            {type === 'wa' && <>
              <p className="text-[11px] adm-t3">Uses an approved AiSensy template name. Params separated by <code>|</code>. Sends are gated by the CRM kill-switch.</p>
              <input className="fb-input text-sm w-full" placeholder="Approved template name" value={v.templateKey} onChange={set('templateKey')} />
              <input className="fb-input text-sm w-full" placeholder="param1 | param2 | …" value={v.params} onChange={set('params')} />
            </>}
            {type === 'email' && <>
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
