// client/src/pages/Feedback.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { submitFeedback, getMyFeedback } from '../services/api';

const TYPES = [
  { v: 'idea', label: '💡 Idea' },
  { v: 'bug', label: '🐞 Bug' },
  { v: 'complaint', label: '😕 Complaint' },
  { v: 'praise', label: '🎉 Praise' },
  { v: 'other', label: 'Other' },
];
const AREAS = ['booking', 'payments', 'dashboard', 'profile', 'availability', 'other'];
const STATUS_STYLE = {
  new: 'bg-gray-100 text-gray-600', reviewing: 'bg-blue-100 text-blue-700',
  planned: 'bg-amber-100 text-amber-700', shipped: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
};

export default function Feedback() {
  const [type, setType] = useState('idea');
  const [area, setArea] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await getMyFeedback(); setItems(data.feedback || []); }
    catch { /* non-fatal */ }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return toast.error('Please write your feedback');
    setSaving(true);
    try {
      await submitFeedback({ type, area: area || undefined, subject: subject || undefined, body, context: { page_url: window.location.href, user_agent: navigator.userAgent } });
      toast.success('Thanks! We read every piece of feedback.');
      setSubject(''); setBody(''); setArea(''); setType('idea');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send feedback');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-sm text-gray-500">Tell us what's working, what's not, and what you'd love to see. We read everything.</p>
      </header>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 max-w-2xl">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button type="button" key={t.v} onClick={() => setType(t.v)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${type === t.v ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <select value={area} onChange={(e) => setArea(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Which area? (optional)</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160}
            placeholder="Short title (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={5}
          placeholder="Your feedback…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <button type="submit" disabled={saving}
          className="btn bg-primary text-white px-5 py-2 text-sm font-medium disabled:opacity-60">
          {saving ? 'Sending…' : 'Send feedback'}
        </button>
      </form>

      <section className="max-w-2xl">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Your feedback</h2>
        {loading ? <p className="text-sm text-gray-400">Loading…</p>
          : items.length === 0 ? <p className="text-sm text-gray-400">You haven't sent any feedback yet.</p>
          : (
            <ul className="space-y-3">
              {items.map((f) => (
                <li key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sm">{f.subject || f.type}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[f.status] || 'bg-gray-100 text-gray-600'}`}>{f.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{f.body}</p>
                  {f.admin_response && (
                    <p className="text-xs text-gray-500 mt-2 border-l-2 border-primary/40 pl-2">
                      <span className="font-semibold">Team:</span> {f.admin_response}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}
