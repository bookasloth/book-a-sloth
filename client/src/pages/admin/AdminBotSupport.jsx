// client/src/pages/admin/AdminBotSupport.jsx
// Bolt support console (SIE phase D-lite): review the knowledge_gaps queue that
// Bolt fills on every escalation / 👎, and promote a gap into a FAQ answer that
// gets served without the model next time. Closes the learning loop's human step.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  adminListBotGaps, adminResolveBotGap,
  adminListBotFaqs, adminCreateBotFaq, adminUpdateBotFaq, adminDeleteBotFaq,
} from '../../services/api';
import { PageHeader, Badge, Skeleton } from '../../components/admin/ui';

const REASON_TONE = { escalated: 'warn', thumbs_down: 'danger' };
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

export default function AdminBotSupport() {
  const [tab, setTab] = useState('gaps');
  const [gapStatus, setGapStatus] = useState('open');
  const [gaps, setGaps] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  // FAQ editor — { pattern, answer, gapId?, editingId? }. null = closed.
  const [form, setForm] = useState(null);

  const loadGaps = async () => {
    setLoading(true);
    try { const { data } = await adminListBotGaps({ status: gapStatus }); setGaps(data.gaps || []); }
    catch { toast.error('Could not load gaps'); }
    finally { setLoading(false); }
  };
  const loadFaqs = async () => {
    setLoading(true);
    try { const { data } = await adminListBotFaqs(); setFaqs(data.faqs || []); }
    catch { toast.error('Could not load FAQs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { tab === 'gaps' ? loadGaps() : loadFaqs(); /* eslint-disable-next-line */ }, [tab, gapStatus]);

  const resolveGap = async (id, resolved) => {
    try { await adminResolveBotGap(id, { resolved }); toast.success(resolved ? 'Resolved' : 'Reopened'); loadGaps(); }
    catch { toast.error('Update failed'); }
  };

  // Promote a gap → prefill the FAQ editor and jump to the FAQs tab.
  const promote = (gap) => {
    setForm({ pattern: (gap.question || '').toLowerCase().slice(0, 120), answer: '', gapId: gap.id });
    setTab('faqs');
  };

  const saveFaq = async () => {
    const pattern = form.pattern.trim(); const answer = form.answer.trim();
    if (!pattern || !answer) { toast.error('Pattern and answer are required'); return; }
    try {
      if (form.editingId) { await adminUpdateBotFaq(form.editingId, { pattern, answer }); toast.success('FAQ updated'); }
      else { await adminCreateBotFaq({ pattern, answer, gapId: form.gapId }); toast.success('FAQ added'); }
      setForm(null); loadFaqs();
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
  };

  const toggleFaq = async (f) => {
    try { await adminUpdateBotFaq(f.id, { enabled: !f.enabled }); loadFaqs(); }
    catch { toast.error('Toggle failed'); }
  };
  const deleteFaq = async (f) => {
    if (!window.confirm(`Delete FAQ "${f.pattern}"?`)) return;
    try { await adminDeleteBotFaq(f.id); toast.success('Deleted'); loadFaqs(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <PageHeader title="Bolt Support" subtitle="Review what Bolt couldn't answer, and turn gaps into instant FAQ answers." />

      <div className="mb-4 flex gap-2">
        {['gaps', 'faqs'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={'rounded-lg px-3 py-1.5 text-sm font-medium ' + (tab === t ? 'bg-[#FE5100] text-white' : 'border adm-border adm-t2')}>
            {t === 'gaps' ? 'Knowledge gaps' : 'FAQ layer'}
          </button>
        ))}
      </div>

      {tab === 'gaps' && (
        <>
          <div className="mb-3">
            <select value={gapStatus} onChange={(e) => setGapStatus(e.target.value)}
              className="border adm-border rounded-lg px-3 py-1.5 text-sm">
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>
          {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            : gaps.length === 0 ? <p className="text-sm adm-t3">Nothing here — Bolt is answering everything. 🎉</p>
              : (
                <div className="space-y-2">
                  {gaps.map((g) => (
                    <div key={g.id} className="rounded-xl border adm-border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge tone={REASON_TONE[g.reason] || 'neutral'}>{g.reason === 'thumbs_down' ? '👎 unhelpful' : 'escalated'}</Badge>
                        <span className="text-xs adm-t3">{fmtDate(g.created_at)}</span>
                        {g.resolved && <Badge tone="ok">resolved</Badge>}
                      </div>
                      <p className="text-sm adm-t1">
                        {g.question || (g.downvoted_answer ? <span className="adm-t2">Downvoted answer: “{g.downvoted_answer.slice(0, 160)}”</span> : <span className="adm-t3">—</span>)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {g.question && (
                          <button onClick={() => promote(g)} className="rounded-lg bg-[#FE5100] px-2.5 py-1 text-xs font-medium text-white">Promote → FAQ</button>
                        )}
                        <button onClick={() => resolveGap(g.id, !g.resolved)} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">
                          {g.resolved ? 'Reopen' : 'Resolve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </>
      )}

      {tab === 'faqs' && (
        <>
          <div className="mb-3">
            <button onClick={() => setForm({ pattern: '', answer: '' })} className="rounded-lg bg-[#FE5100] px-3 py-1.5 text-sm font-medium text-white">+ Add FAQ</button>
          </div>

          {form && (
            <div className="mb-4 rounded-xl border adm-border p-3">
              <label className="mb-1 block text-xs font-semibold adm-t2">Trigger phrase (matched as a substring of the question)</label>
              <input value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                placeholder="e.g. reset password" className="mb-3 w-full rounded-lg border adm-border px-3 py-2 text-sm" />
              <label className="mb-1 block text-xs font-semibold adm-t2">Answer (markdown; served verbatim, no model)</label>
              <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4}
                placeholder="Keep prices/policy OUT — link the docs instead so it can't go stale." className="mb-3 w-full rounded-lg border adm-border px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={saveFaq} className="rounded-lg bg-[#FE5100] px-3 py-1.5 text-sm font-medium text-white">{form.editingId ? 'Save' : 'Add'}</button>
                <button onClick={() => setForm(null)} className="rounded-lg border adm-border px-3 py-1.5 text-sm adm-t2">Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : faqs.length === 0 ? <p className="text-sm adm-t3">No FAQs yet. Add one, or promote a gap.</p>
              : (
                <div className="space-y-2">
                  {faqs.map((f) => (
                    <div key={f.id} className="rounded-xl border adm-border p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <code className="rounded bg-[#FFF4EC] px-1.5 py-0.5 text-xs text-[#1E1E1E]">{f.pattern}</code>
                        <Badge tone={f.enabled ? 'ok' : 'neutral'}>{f.enabled ? 'live' : 'off'}</Badge>
                      </div>
                      <p className="text-sm adm-t2">{f.answer.slice(0, 200)}{f.answer.length > 200 ? '…' : ''}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => setForm({ pattern: f.pattern, answer: f.answer, editingId: f.id })} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">Edit</button>
                        <button onClick={() => toggleFaq(f)} className="rounded-lg border adm-border px-2.5 py-1 text-xs adm-t2">{f.enabled ? 'Disable' : 'Enable'}</button>
                        <button onClick={() => deleteFaq(f)} className="rounded-lg border adm-border px-2.5 py-1 text-xs text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </>
      )}
    </div>
  );
}
