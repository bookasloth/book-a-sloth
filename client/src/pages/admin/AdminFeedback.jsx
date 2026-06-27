// client/src/pages/admin/AdminFeedback.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminListFeedback, adminUpdateFeedback } from '../../services/api';

const STATUSES = ['new', 'reviewing', 'planned', 'shipped', 'declined'];
const STATUS_STYLE = {
  new: 'bg-gray-100 text-gray-600', reviewing: 'bg-blue-100 text-blue-700',
  planned: 'bg-amber-100 text-amber-700', shipped: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
};

export default function AdminFeedback() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // row being triaged
  const [resp, setResp] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await adminListFeedback(filter ? { status: filter } : {}); setItems(data.feedback || []); }
    catch (e) { toast.error('Could not load feedback'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const openRow = (f) => { setActive(f); setResp(f.admin_response || ''); setNote(f.admin_note || ''); };

  const save = async (status) => {
    try {
      await adminUpdateFeedback(active.id, { status, admin_response: resp, admin_note: note });
      toast.success(`Marked ${status}`);
      setActive(null); load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Update failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Host Feedback</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p>
        : items.length === 0 ? <p className="text-sm text-gray-400">No feedback.</p>
        : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr><th className="text-left px-4 py-2">Host</th><th className="text-left px-4 py-2">Type</th><th className="text-left px-4 py-2">Feedback</th><th className="text-left px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{f.profiles?.name || '—'}</td>
                    <td className="px-4 py-2">{f.type}{f.area ? ` · ${f.area}` : ''}</td>
                    <td className="px-4 py-2 max-w-md truncate">{f.subject || f.body}</td>
                    <td className="px-4 py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[f.status]}`}>{f.status}</span></td>
                    <td className="px-4 py-2 text-right"><button onClick={() => openRow(f)} className="text-primary text-xs font-medium hover:underline">Triage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {active && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setActive(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold">{active.subject || active.type}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{active.body}</p>
            <div>
              <label className="text-xs font-semibold text-gray-500">Reply to vendor (sent on planned/shipped/declined)</label>
              <textarea value={resp} onChange={(e) => setResp(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Internal note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => save(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50">{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
